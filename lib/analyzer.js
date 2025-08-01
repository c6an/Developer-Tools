import { XSS_INJECT_TARGET, XSS_MARKER, JAVASCRIPT_REGEXP } from "./config.js";
import request           from "./request.js";
import { Sender }        from "./messegeController.js";
import { FILTER_RESULT, FILTER_DATA } from "./config.js";

export default class Analyzer extends request{
    constructor(){
        super();
        this.delay               = null;
        this.data_response       = null;
        this.raw_response        = null;
        this.pure_response       = null;
        this.reflection_counter  = null;
        this.find_context        = 0;
        this.data_info           = []; 
        this.scan_msg            = {};
    }

    async analyzer_init(url, param, delay, cookie=true, headers=null){
        this.delay = delay;
        await this.#test_request(url, param, cookie, headers);
    }

    async #test_request(url, param, cookie, headers){
        this.data_info     = [];
        this.scan_msg      = {"reflection-type" : []};
        this.find_context  = 0;
        let header         = headers;
        let parameter      = this.payload_injector(param, XSS_MARKER);
        if(headers){header = this.header_generator(header);}
        let full_url       = this.url_generator(url, parameter);
        let response       = await this.get(full_url, 0, cookie, header);
        this.data_response = await response;
        this.raw_response  = await response.text();
    }

    payload_injector(param, payload){
        if(Object.prototype.toString.call(param)   != "[object Object]"){throw new Error("Type Error (method payload_injector arg1)");}
        if(Object.prototype.toString.call(payload) != "[object String]"){throw new Error("Type Error (method payload_injector arg2)");}
        let raw_param      = { ...param };
        let param_values   = Object.values(param);
        let target_index   = param_values.indexOf(XSS_INJECT_TARGET);
        let inject_target  = Object.entries(param)[target_index];

        raw_param[inject_target[0]] = payload;
        return raw_param;
    }   

    #reflection_checker(){
        let response = this.raw_response;
        let regexp   = new RegExp(XSS_MARKER,"g");
        let count    = response.match(regexp);
        this.reflection_counter = count ? count.length : 0;
    }


    #comment_breaker(){
        let response       = this.raw_response;
        this.pure_response = response.replace(/<!--[\s\S]*?-->/g, '').replace(/<\!--[\s\S]*?-->/g, '');
    }   
    
    #javascript_analyzer(){ 
        let javascripts = this.#javascript_extractor(this.pure_response); 
        let count = 0;
        for(let i = 0; javascripts.length > i; i++){
            let js_code          = javascripts[i];
            let reflection_regex = new RegExp(XSS_MARKER, "g");
            count += (js_code.match(reflection_regex) || []).length;
        }
        if(count <= 0)return false;

        let regexp        = new RegExp(`(${XSS_MARKER}.*?)$`, "gm");
        let found_context = []; 
        for(let js_code of javascripts){
            for(let matched_context of js_code.matchAll(regexp)){
                found_context.push(matched_context);
            }
        }
        if(found_context.length === 0)return false;
        
        let result = null;
        this.scan_msg["reflection-type"].push("JAVASCRIPT");
        let ref_location = {"location-type" : "javascript"};
        for(let found_group of found_context){
            let ref_status       = {};
            let captured         = found_group[1];
            ref_status["status"] = {"quote" : ""};
            for(let i = 0; captured.length > i; i++){
                let one_char = captured[i];
                if(`"'/\``.includes(one_char) && !this.#quote_escape_checker(captured, i)){
                    ref_status["status"]["quote"] = one_char;
                    break;
                }
                if(`)]}`.includes(one_char) && !this.#quote_escape_checker(captured, i))break;
            } 
            result = Object.assign({}, ref_location);
            result["location-index" ] = found_group.index + found_group[0].indexOf(XSS_MARKER);
            result["location-status"] = ref_status
            this.data_info.push(result);
            this.find_context += 1;
            result = null;
        }
    }

    #javascript_extractor(response){
        let script_arr = [];
        let script

        while((script = JAVASCRIPT_REGEXP.exec(response)) !== null){
            let js_code = script[1].trim();
            if(js_code !== ""){
                script_arr.push(js_code);
            }
        }
        return script_arr;
    }

    #quote_escape_checker(str,index){
        let count = 0;
        index--; 
        while (index >= 0 && str[index] === '\\') {
            count++;
            index--;
        }
        return count % 2 === 1;
    }
    
    #attribute_analayzer(){
        let only_html  = this.#javascript_breaker(this.pure_response);
        let regexp     = new RegExp(`<[^>]*?(${XSS_MARKER})[^>]*?>`, "g");
        let tag_list   = []
        for(let matched_tag of only_html.matchAll(regexp)){tag_list.push(matched_tag);}
        if(tag_list.length <= 0)return false;

        this.scan_msg["reflection-type"].push("ATTR");
        let ref_location = {"location-type" : "attribute"}
        let result       = null;
        for(let tags of tag_list){
            let tag      = tags[0];
            let parts    = tag.split(/\s+/);
            let loc_idx  = tags.index + tags[0].indexOf(tags[1]);
            let tag_name = tag.match(/^<(\w+)/) ? tag.match(/^<(\w+)/)[1] : null;

            for(let part of parts){
                if(!part.includes(XSS_MARKER))continue;
                let ref_type = "", ref_quote = "", ref_name = "", ref_value = "";

                if(part.includes("=")){
                    let using_quote = part.match(/=(["'`])?/);
                    ref_quote       = using_quote && using_quote[1] ? using_quote[1] : "";

                    let slice_idx   = part.indexOf("=");
                    let attr_name   = part.substring(0, slice_idx);
                    let attr_value  = part.substring(slice_idx + 1);
                    ref_name        = attr_name;
                    
                    if(XSS_MARKER === attr_name)ref_type = "attr-name";
                    else ref_type   = "attr-value";
                    ref_value       = attr_value.replace(/^["'`]/, '').replace(/["'`>]$/, '').trim();
                }
                else ref_type       = "attr-flag";
                
                result = Object.assign({}, ref_location);
                result["location-index" ] = loc_idx;
                result["location-status"] = {"status" : {"type" : ref_type, "name" : ref_name, "value" : ref_value, "quote" : ref_quote, "tag" : tag_name}};
                
                this.data_info.push(result);
                this.find_context += 1;
                result = null;
            }
        }
    }

    #javascript_breaker(response){
        return response.replace(JAVASCRIPT_REGEXP, "");
    }

    #html_analyzer(){
        let response = this.pure_response;
        let htmls    = [];
        let regexp   = new RegExp(XSS_MARKER, "g")
        for(let matched_html of response.matchAll(regexp))htmls.push(matched_html);
        if(htmls.length <= 0)return false;

        this.scan_msg["reflection-type"].push("HTML");
        let ref_location   = {"location-type" : "html"};
        let result         = null
        for(let html of htmls){
            let ref_index  = html.index;
            let ref_status = {"status" : {}}

            result = Object.assign({}, ref_location);
            result["location-index" ] = ref_index;
            result["location-status"] = ref_status;
            this.data_info.push(result);
            this.find_context += 1;
            result = null;
        }
    }

    #comment_analyzer(){
        let response     = this.raw_response;
        let regexp       = new RegExp(`<!--[\\s\\S]*?(${XSS_MARKER})[\\s\\S]*?-->`, "g");
        let comment_list = []; 
        for(let matched_comment of response.matchAll(regexp))comment_list.push(matched_comment);
        if(comment_list.length <= 0)return false;
        
        this.scan_msg["reflection-type"].push("COMMENT");
        let ref_location   = {"location-type" : "comment"};
        let result         = null;
        for(let comments of comment_list){
            let ref_index  = comments.index + comments[0].indexOf(comments[1]);
            let ref_status = {"status" : {}}

            result = Object.assign({}, ref_location);
            result["location-index" ] = ref_index;
            result["location-status"] = ref_status;
            this.data_info.push(result);
            this.find_context        += 1;
            result                    = null;
        }
    }

    match_finder(type, target){
        // 
    }

    filter_res_send(count, type, status, paylaod){
        // 구현 예정
    }

    analyzing(param){
        this.scan_msg["param"] = param;
        this.#reflection_checker();
        if(this.reflection_counter == 0){
            this.scan_msg["reflection-count"] = 0; 
            this.scan_msg["reflection-type" ].push("");
            this.scan_msg["status" ]          = "";
            this.scan_msg["payload"]          = "값이 reflected되지 않음.";

            let copy_scan_msg       = Object.assign({},this.scan_msg);
            let none_reflect_sender = new Sender(FILTER_RESULT)
            none_reflect_sender.req_set({[FILTER_DATA] : copy_scan_msg});
            none_reflect_sender.send(null, null);
            return false;
        }
        else{this.scan_msg["reflection-count"] = this.reflection_counter;}
        this.#comment_breaker();
        this.#javascript_analyzer();
        let reflection = this.reflection_counter - this.find_context;
        if(reflection <= 0)return true;
        this.#attribute_analayzer();
        reflection = this.reflection_counter - this.find_context;
        if(reflection <= 0)return true;
        this.#html_analyzer();
        reflection = this.reflection_counter - this.find_context;
        if(reflection <= 0)return true;
        this.#comment_analyzer();
    }
}
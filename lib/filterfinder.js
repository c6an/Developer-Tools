import Analyzer                      from "./analyzer.js";
import { START_CHUNCK, END_CHUNK }   from "./config.js";
import { Sender }                    from "./messegeController.js";
import { FILTER_RESULT, FILTER_DATA} from "./config.js";

export default class Filter_Finder extends Analyzer{
    constructor(){
        super();
        this.filter_check_list = ["<", ">"];
    }

    #filter_check_list_update(){
        for(let i = 0; this.data_info.length > i; i++){
            let current_context = this.data_info[i];
            let location_type   = this.#location_type_checker(current_context);
            switch(location_type){
                case "javascript":
                    this.#javascript_filter_keyword_setter(current_context);
                    break;
                case "attribute":
                    this.#attribute_filter_keyword_setter(current_context);
                    break;
                case "comment":
                    this.#commnet_filter_keyword_setter();
                    break;
            }
        }
    }
    
    #location_type_checker(current_context){
        return current_context["location-type"];
    }


    #javascript_filter_keyword_setter(current_context){
        let using_quote = current_context["location-status"]["status"]["quote"];
        this.#list_adder(using_quote);
        this.#list_adder("</ScrIpT/>");
    }


    #attribute_filter_keyword_setter(current_context){
        let tag_name        = current_context["location-status"]["status"]["tag"  ];
        let reflection_type = current_context["location-status"]["status"]["type" ];
        let attribute_name  = current_context["location-status"]["status"]["name" ];
        let using_quote     = current_context["location-status"]["status"]["quote"];
        if(using_quote.length > 0)this.#list_adder(using_quote);

        switch(reflection_type){
            case "attr-name":
                if(tag_name == "iframe")this.#list_adder("SrcDoC");
                if(tag_name == "a"     )this.#list_adder("HrEf"  );
                this.#list_adder("oN")
                break;
            case "attr-value":
                if(attribute_name == "srcdoc")this.#list_adder("&lt;");this.#list_adder("&gt;");
                break;
        }
    }

    #commnet_filter_keyword_setter(){
        this.#list_adder("-->");
    }

    #list_adder(value){
        if(!this.filter_check_list.includes(value))this.filter_check_list.push(value);
    }


    async checking_request(url, param, delay, cookie=true, headers=null){
        let check_list                  = this.filter_check_list;
        for(let target of check_list){
            let marking_data            = START_CHUNCK + target + END_CHUNK;
            let test_param              = this.payload_injector(param, marking_data); 
            let test_url                = this.url_generator(url, test_param);
            let response_obj            = await this.get(test_url, delay, cookie, headers);
            let response                = await response_obj.text();
            let checking_res            = this.#value_status_checker(response, target);

            this.scan_msg["status"]     = checking_res;
            this.scan_msg["payload"]    = target; 
            let basic_filter_res_copy   = Object.assign({}, this.scan_msg);
            let basic_filter_res_sender = new Sender(FILTER_RESULT);
            basic_filter_res_sender.req_set({[FILTER_DATA] : basic_filter_res_copy});
            basic_filter_res_sender.send(null, null);
        }
    }

    #value_status_checker(response, target){
        let test_values = this.test_value_extractor(response);
        if(test_values.length > 10){
            test_values = test_values.substring(0, 9) + "...";
        }
        if(test_values !== target){
            return `Filtered(${test_values})`;
        }
        return `Vulnerable(${test_values})`;
    }

    test_value_extractor(response){
        let resp     = response;
        let de_resp  = this.#decode_html_entities(response);
        let regexp   = new RegExp(`${START_CHUNCK}(.*?)${END_CHUNK}`, 's');
        let test_val = resp.match(regexp);
        if(!test_val){
            test_val = de_resp.match(regexp);
        }
        return test_val ? test_val[1] : " "; 
    }

    #decode_html_entities(str) {
          let map = {
            '&amp;'  : '&',
            '&lt;'   : '<',
            '&gt;'   : '>',
            '&quot;' : '"',
            '&#39;'  : "'",
            '&#x2F;' : '/',
            '&#96;'  : '`',
            '&#x3D;' : '='
        };

        return str.replace(/&[#\w]+;/g, (entity) => map[entity] || entity);
    }

    async filter_checking(url, param, delay, cookie=true, headers=null){
        this.filter_check_list = ["<", ">"];
        let analyze_param = Object.assign({}, param);
        await this.analyzer_init(url, analyze_param, delay, cookie, headers);
        if(!this.analyzing(this.target_param_extractor(param)))return false;

        let filter_check_param = Object.assign({}, param);
        this.#filter_check_list_update();
        await this.checking_request(url, filter_check_param, delay, cookie, headers);
        return true;
    }
}
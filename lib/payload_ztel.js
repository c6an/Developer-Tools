import Advance_Filter_Finder       from "./advanced_filterfinder.js";
import { Sender }                  from "./messegeController.js";
import Input_Parser                from "./inputpaser.js";
import { START_CHUNCK, END_CHUNK, ATTACK_RESULT, ATTACK_DATA } from "./config.js";


// impl붙은 함수는 전부 임시로 사용
// {payload : "", response : "", param : "", url : "", target : ""}
export default class Payload_Ztel extends Advance_Filter_Finder{
    constructor(){
        super();
        this.parser     = new Input_Parser();
        this.attack_msg = {};  
    }

    #attack_setting(){
        this.attack_msg = {};
    }

    #attack_param_generator(){
        
    }

    #send_attack_msg(target, payload, param, url, response){

    }

    async attack_factory(url, param, delay, cookie=true, headers=null){
        this.#attack_setting();
    }

    // =================================================================================== ↓ 임시 함수
    
    
    async #impl_payload_loader(){
        let payload = await fetch(chrome.runtime.getURL("asset/payload.txt"));
        payload     = await payload.text();
        payload     = payload.split("\n").filter(Boolean);
        return payload;
    }

    #impl_pay_param_generator(url, param, payload){
        let copy_param     = Object.assign({}, param); 
        let check_pay      = START_CHUNCK + payload + END_CHUNK;
        check_pay          = encodeURIComponent(check_pay);
        let injected_param = this.payload_injector(copy_param, check_pay);
        let full_url       = this.url_generator(url, injected_param);
        return full_url;
    }

    #impl_attack_checker(response, payload){
        let attack_res = this.test_value_extractor(response);
        if(attack_res == " "    )return false;
        if(attack_res == payload) return true;
        return false
    }

    async #impl_dumb_attack_stub(url, param, delay, cookie=true, headers=null, target){
        let payloads  = await this.#impl_payload_loader();
        for(let payload of payloads){
            let full_url        = this.#impl_pay_param_generator(url, param, payload); 
            let response_obj    = await this.get(full_url ,delay, cookie, headers);
            if(Object.prototype.toString.call(response_obj) != "[object Response]"){continue;}
            let response        = await response_obj.text();

            if(this.#impl_attack_checker(response, payload)){
                let pure_response           = response.replace(START_CHUNCK, "").replace(END_CHUNK, "");
                this.attack_msg["response"] = pure_response;
                this.attack_msg["payload"]  = payload;
                this.attack_msg["param"]    = this.parser.param_extractor(full_url);
                this.attack_msg["url"]      = url; 
                this.attack_msg["target"]   = target;
                console.log(target);

                let sender          = new Sender(ATTACK_RESULT);
                let attack_msg_copy = Object.assign({}, this.attack_msg)
                sender.req_set({[ATTACK_DATA] : attack_msg_copy});
                sender.send(null, null);
            }
        }

    }

    async impl_attack_factory(url, param, delay, cookie=true, headers=null, target){
        this.#attack_setting();
        console.log(target);
        await this.#impl_dumb_attack_stub(url, param, delay, cookie, headers, target);
    }
}
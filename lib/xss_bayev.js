import Payload_Ztel               from "./payload_ztel.js";
import Input_Parser               from "./inputpaser.js";
import sign                       from "./operator.js";
import { Sender }                 from "./messegeController.js";
import { mov_popup2, mov_result } from "./config.js";

export default class Xss_Bayev extends Payload_Ztel{
    constructor(option_obj_info){
        if(Object.prototype.toString.call(option_obj_info) != "[object Object]"){throw new Error("Type Error (calss Xss_Bayev constructor arg1)");}
        super();
        this.option_keys  = option_obj_info;
        this.parser       = new Input_Parser();
        this.dom_oper     = sign();

        this.url          = null;
        this.param        = null; 
        this.target_param = null;
        this.cookie       = true;
        this.delay        = 1;
    }

    async setting(user_input){
        let url           = user_input[this.option_keys["url"]].trim()    ? user_input[this.option_keys["url"]].trim()    : null;
        let target_param  = user_input[this.option_keys["target_params"]] ? user_input[this.option_keys["target_params"]] : null;
        let cookie        = user_input[this.option_keys[    "cookie"   ]] ? user_input[this.option_keys[    "cookie"   ]] : true;
        let delay         = Number(user_input[this.option_keys["delay"]]) ? Number(user_input[this.option_keys["delay"]]) : 1;

        this.url          = url          ? this.parser.url_extractor(url)                  : null;
        this.target_param = target_param ? target_param                                    : null;
        this.param        = url          ? this.parser.param_parser(url)                   : null;
        this.cookie       = this.dom_oper.born(cookie) == Boolean ? cookie                 : true; 
        this.delay        = delay;

        if(!this.url){
            this.#error_sender("URL을 입력해주세요.");
            return false;
        }
        if(!this.#url_protocol_checker()){
            this.#error_sender("URL은 http:// 또는 https://로 시작해야 합니다.");   
            return false;
        }
        if(!this.param){
            this.#error_sender("URL에 파라미터가 없습니다..");
            return false;
        }
        if(!this.target_param){
            this.#error_sender("공격 파라미터를 지정해주세요.");
            return false;
        }
        if(this.delay < 0){
            this.#error_sender("딜레이를 양수로 설정해 주세요.");
            return false;
        }
        this.#target_param_parser();
        return this;
    }


    #error_sender(msg){
        let sender = new Sender();
        sender.error_send({payload : msg});     
    }

    #url_protocol_checker(){
        let url = this.url;
        if(url.startsWith("http://") || url.startsWith("https://")) return true;
        return false;
    }

    #target_param_parser(){
        let target_param_stirng = this.target_param;
        let target_params       = target_param_stirng.trim().split(",").filter(Boolean);
        let target_list         = [];
        for(let target_param of target_params){
            target_list.push(target_param.trim());
        }
        this.target_param = target_list
    }

    #before_reg_checker(){
        if(!this.url   ) return false;
        if(!this.param ) return false;
        if(!this.delay ) return false;
        if(!this.cookie) return false;
        if(!this.target_param) return false;
        return true;
    }




    async filter_cosmo(){
        let sender = new Sender(mov_popup2);
        sender.send(null, null);
        for(let target of this.target_param){;
            let params       = Object.assign({}, this.param);
            let mani_params  = this.param_targeter(params, target); // 조작된 파라미터
            await this.filter_factory(this.url, mani_params, this.delay, this.cookie, null);
        }
        this.#error_sender("검사 완료");
    }

    async attack_naut(param){
        if(Object.prototype.toString.call(param["test-param"]) != "[object String]"){console.log("Err attack_naut"); return false;}

        if(!this.#before_reg_checker()){this.#error_sender("필터링 확인을 먼저 시도한 후, 사용 할 수 있는 기능입니다.");}  
        if(!param["test-param"] || param["test-param"].trim() == ""){this.#error_sender("파라미터를 지정하세요."); return false} 
        if(this.target_param == null || !(this.target_param.includes(param["test-param"]))){
            this.#error_sender("테스트를 마친 파라미터만 스캔 할 수 있습니다.");
            return false;
        } 

        let sender = new Sender(mov_result);
        sender.send(null, null);

        let target     = param["test-param"];
        let copy_param = Object.assign({}, this.param);
        let mani_param = this.param_targeter(copy_param, target);
        let copy_target= Object.assign({}, param);
        let cpst_target= copy_target["test-param"];

        await this.impl_attack_factory(this.url, mani_param, this.delay, this.cookie, null, cpst_target);
    }
}
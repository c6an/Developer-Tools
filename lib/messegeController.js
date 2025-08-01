import { ERROR_MSG } from "./config.js";

export class Sender{
    constructor(msg="", sign = null){
        if(Object.prototype.toString.call(msg) != "[object String]"){throw new Error("Type Error (class Msg arg1)");}
        this.msg;
        this.sign = sign;

        this.#config(msg);
    }

    #config(msg){
        this.#msg_construct_set(msg);
    }
    
    #msg_construct_set(msg){
        this.msg = {type : msg};
    }

    req_set(msg){
        if(Object.prototype.toString.call(msg) != "[object Object]"){throw new Error("Type Error (class Msg arg1)");}
        let msg_keys = Object.keys(msg);
        for(let msg_key of msg_keys){
            this.msg[msg_key] = msg[msg_key];
        }
        return this;
    }

    send(func=null, fail_func = null){
        if(func      != null){if(Object.prototype.toString.call(func)      != "[object Array]"){throw new Error("Type Error (method send arg1)")} }
        if(fail_func != null){if(Object.prototype.toString.call(fail_func) != "[object Array]"){throw new Error("Type Error (method send arg2)")}}
        let sign = null;
        if(this.sign)sign = Object.keys(this.sign)[0];
        
        if(func && fail_func && this.sign)return this.#fail_check_func_sending(func, fail_func, sign);
        else if(   fail_func && this.sign)return this.#fail_check_sending     (      fail_func, sign);
        else if(   func                  )return this.#none_check_func_sending(func                 );
        else return this.#none_check_sending();
    }

    #fail_check_func_sending(funcs, fail_funcs, sign){
        let data = chrome.runtime.sendMessage(this.msg,
            (response)=>{
                for(let func of funcs){func();}
                if(response?.[sign] != this.sign[sign]){
                    for(let fail_func of fail_funcs){fail_func();} 
                }
            }
        )
        return data
    }

    #none_check_func_sending(funcs){
        let data = chrome.runtime.sendMessage(this.msg,
            (response)=>{for(let func of funcs){func();}}
        )
        return data
    }

    #fail_check_sending(fail_funcs, sign){
        let data = chrome.runtime.sendMessage(this.msg,
            (response)=>{
                if(response?.[sign] != this.sign[sign]){
                    for(let fail_func of fail_funcs){fail_func();} 
                }
            }
        )
        return data
    }

    #none_check_sending(){  
        let data = chrome.runtime.sendMessage(this.msg)
        return data
    }

    error_send(message){
        this.msg.type = ERROR_MSG;
        this.req_set(message);
        this.send(null, null);
        return this;
    }
}



export class Recver{
    constructor(){
        this.resp_msg = [];
    }

    recv(message, funcs){
        if(Object.prototype.toString.call(funcs) != "[object Array]"){throw new Error("Type Error (method recv arg2)");}
        chrome.runtime.onMessage.addListener(
            (msg)=>{
                if(msg.type === message){
                    for(let func of funcs){func(msg);}
                }
            }
        )
        return this
    }

    #resp_message_finder(message){
        let msg_list    = this.resp_msg;
        for(let i = 0; msg_list.length > i; i++){
            let msg     = msg_list[i];
            let msg_val = Object.values(msg)[0];
            if(msg_val == message){ return msg; }
        }
        return false;
    }

    resp_set(resp_msg){
        if(     Object.prototype.toString.call(resp_msg) == "[object Object]")this.resp_msg.push(resp_msg);
        else if(Object.prototype.toString.call(resp_msg) == "[object Array]" ){
            for(let one_resp of resp_msg){this.resp_msg.push(one_resp);}
            return this
        }else{throw new Error("Type Error method resp_set arg1");}
    }

    recv_resp(message, funcs, resp_message){
        if(this.resp_msg.length <= 0){throw new Error("resp_msg 설정되지 않음");}
        if(!resp_message){throw new Error("method recv_resp arg3 전달되지 않음");   }
        if(Object.prototype.toString.call(funcs) != "[object Array]"){throw new Error("Type Error (method recv_resp arg2)");}
        
        let resp_msg = this.#resp_message_finder(resp_message);
        if(!resp_msg){throw new Error("method recv_resp 일치하는 응답 메세지가 존재하지 않음");}


        chrome.runtime.onMessage.addListener(
            (msg, sender, sendResponse)=>{
                if(msg.type === message){
                    for(let func of funcs){func(msg);}
                    sendResponse(resp_msg);
                    return true;
                }
            }
        )
    }   

    error_recv(funcs){
        this.recv(ERROR_MSG, funcs);
        return this;
    }
}
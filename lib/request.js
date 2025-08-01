import { XSS_INJECT_TARGET } from "./config.js";

let request = function(){}

request.prototype.sleep = function(time){
    return new Promise(resolve => setTimeout(resolve, time*1000));
}

request.prototype.get = async function(url, delay, cookie, headers=null){
    await this.sleep(delay);

    let options = false;
    if (cookie){
        options = {"method" : "GET"};
        if(cookie) { options["credentials"] = "include";}
        // if(headers){ options["headers"]     =  headers; }
    }

    try{
        let response;
        if(!options){
            response = await fetch(url);
        }else{
            response = await fetch(url, options);
        }
        return response;
    }catch(err){
        console.log(`Request Error : ${err}`);
        return {error : err};
    }
}

request.prototype.url_generator = function(url, param){
    if(Object.prototype.toString.call(url) != "[object String]"){throw new Error("Type Error (method  url_generator arg1)");}

    let param_combine = function(param_dict){
        if(Object.prototype.toString.call(param_dict) != "[object Object]"){throw new Error("Type Error (inner function param_combine arg1)");}
        let param_keys          = Object.keys(param_dict);
        let assign_mapped_param = [];
        for(let i = 0; param_keys.length > i; i++){
            let assign_param = param_keys[i] + "=" + param_dict[param_keys[i]];
            assign_mapped_param.push(assign_param);
        }
        let full_param = assign_mapped_param.join("&");
        return full_param
    }

    let parameter  = param_combine(param);
    let result_url = url + "?" + parameter;
    return result_url; 
}

request.prototype.header_generator = function(headers){
    if(Object.prototype.toString.call(headers) != "[object Object]"){throw new Error("Type Error (method header_genenrator arg2)");}
    let header_keys = Object.keys(headers);
    let header_ins = new Headers();
    for(let i = 0; header_keys.length > i; i++){
        let header_key = header_keys[i]
        header_ins.append(header_key, headers[header_key]);
    }
    return header_ins   
}


request.prototype.param_targeter = function(param_obj, target_param){
    if(Object.prototype.toString.call(param_obj)    != "[object Object]"){throw new Error("Type Error (method param_targeter arg1)");}
    if(Object.prototype.toString.call(target_param) != "[object String]"){throw new Error("Type Error (method parma_targeter arg2)");}
    let param = param_obj;
    param[target_param] = XSS_INJECT_TARGET;
    return param;
}   

request.prototype.target_param_extractor = function(param_obj){
    if(Object.prototype.toString.call(param_obj) != "[object Object]"){throw new Error("Type Error(method target_param_extractor arg1)");}
    let param_vals = Object.values(param_obj);
    let param_keys = Object.keys  (param_obj);
    for(let i = 0; param_vals.length > i; i++){
        let param_val = param_vals[i];
        if(param_val == XSS_INJECT_TARGET){
            return param_keys[i];
        }
    }
    return false
}

export default request;
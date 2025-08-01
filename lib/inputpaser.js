export default class Input_Parser{
    header_paser(keyword, obj){
        let header_str  = obj[keyword];
        let header_line = header_str.split("\n").filter(Boolean);
        let header_obj  = {};
        for(let i = 0; header_line.length > i; i++){
            let header_atom = header_line[i].trim().split(":");
            let header_key  = header_atom[0].trim();
            let header_val  = header_atom[1].trim();
            header_obj[header_key] = header_val;
        }
        return header_obj;
    }

    param_parser(url){
        let params = this.param_extractor(url);
        if(params == ""){return null;}
        let params_list = params.trim().split("&");
        let param_dict  = {};
        for(let param_list of params_list){
            let one_param_list = param_list.trim().split("=");
            let param_key      = one_param_list[0];
            let param_val      = one_param_list[1];
            param_dict[param_key] = param_val;
        }
        return param_dict;
    }

    param_keys(url){
        let params = this.param_extractor(url);
        let params_list = params.trim().split("&");
        let key_array   = [];
        for(let param_list of params_list){
            key_array.push(param_list.trim().split("=")[0]);
        }
        return key_array;
    }

    param_extractor(url){
        if(url.includes("?")){
            let param = url.trim().split("?")[1].trim();
            if(param.includes("#")){param = param.split("#")[0].trim();}
            return param;
        } 
        return "";
    }
    
    url_extractor(url){
        if(url.includes("?")){
            return url.trim().split("?")[0].trim();
    
        }
        return url;
    }
}
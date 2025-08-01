import { ERROR_BANNER } from "./config.js";

class Operator{
    constructor(){
        this.tax = {};
    }

    gen(element_name, attr=null){
        let element = document.createElement(element_name);
        if(attr){this.attr(element, attr);}
        return element;
    }

    attr(element, setting_obj){
        if(this.born(setting_obj)!= Object){throw new Error("Type Error (method attr arg2)")}
        if(this.born(element)    == String){element = this.id(element);}
        let attr_keys = this.keys(setting_obj);
        let arrt_vals = this.values(setting_obj);
        for(let i = 0; attr_keys.length > i; i++){
            element.setAttribute(attr_keys[i], arrt_vals[i]);
        }
        return this
    }

    apear(target, stl){
        if(this.born(stl) != Object){throw new Error("Type Error (method apear arg2)");}
        if(!this.#element_checker(target)){throw new Error("Type Error (method apear arg1)");}
        let dom_element = this.#dom_finder(target);
        let stl_keys = this.keys(stl);
        let stl_vals = this.values(stl);
        
        for(let i = 0; stl_keys.length > i; i++){
            let stl_key = stl_keys[i];
            let stl_val = stl_vals[i];
            dom_element.style[stl_key] = stl_val;
        }
    }

    append(target, element){
        let dom_element;
        try{ dom_element = this.#dom_finder(target);}
        catch(err){throw new Error(`Error method append (${err})`);}
        let ch_element;
        try{ ch_element = this.#dom_finder(element);}
        catch(err){throw new Error(`Error method append (${err})`);}
        dom_element.appendChild(ch_element);
    }

    appends(target, elements){
        if(this.born(elements) != Array){throw new Error("Type Error (method appends arg2)");}
        for(let element of elements){
            try{this.append(target, element);}
            catch(err){throw new Error(`Error method appends (${err})`);}
        }
    }

    #dom_finder(target){
        if(this.#element_checker(target)) return target;
        if(this.born(target) == String){
            let dom_element = this.id(target);
            if(dom_element) return dom_element;
            else{throw new Error(`doesn't exsist element id '${target}' (method #dom_finder)`);}
        }
    }

    #element_checker(element){
        if(element instanceof HTMLElement) return true;
        return false;
    }

    id(element_id){
        return document.getElementById(element_id);
    }

    born(target){
        let magic = Object.prototype.toString.call(target)
        switch(magic){
            case "[object String]":
                return String;
            case "[object Array]":
                return Array;
            case "[object Number]":
                return Number
            case "[object Object]":
                return Object
            case "[object Function]":
                return Function;
            case "[object Boolean]":
                return Boolean;
        }
    }

    keys(obj){
        if(this.born(obj) != Object){throw new Error("Type Error (keys method arg1)");}
        return Object.keys(obj)
    }

    values(obj){
        if(this.born(obj) != Object){throw new Error("Type Error (values method arg1)");}
        return Object.values(obj)
    }

    sign(marking, id_list){
        if(this.born(marking) != String){throw new Error("Type Error (sign method arg1)");}
        if(this.born(id_list) != Array) {throw new Error("Type Error (sign method arg2)");}
        this.tax[marking] = id_list;
        return this;
    }

    levy(marking){
        let id_list = this.tax[marking];
        let result  = {};
        for(let i = 0; id_list.length > i; i++){
            let element_id     = id_list[i];
            result[element_id] = this.scan(element_id);
        }
        return result;
    }

    scan(element_id){
        let dom_element = this.id(element_id);
        let tag_name    = this.#tag_name_finder(dom_element).toLowerCase();
        switch(tag_name){
            case "input":
                let input_type = this.#input_type_checker(dom_element).toLowerCase();
                switch(input_type){
                    case "checkbox":
                        return dom_element.checked;
                    case "combobox":
                        let current_index = dom_element.selectedIndex;
                        let current_value = dom_element.options[current_index].value;
                        return current_value;
                    default:
                        return dom_element.value;
                }
            case "div":
                return dom_element.innerText;
            default:
                return dom_element.value;
        }
    }

    print(element_id, text){
        let dom_element = this.id(element_id);
        let tag_name    = this.#tag_name_finder(dom_element).toLowerCase();
        let inner_text  = ["a", "div", "p", "span", "li", "code"]
        let status      = false;

        for(let part of inner_text){
            if(tag_name == part)status   = true;
        }
        if(status){dom_element.innerText = text;}
        else{dom_element.value           = text;}
        return this;
    }

    #input_type_checker(dom_element){
        return dom_element.type;
    }

    #tag_name_finder(dom_element){
        return dom_element.tagName;
    }

    visible(element_id){
        this.id(element_id).style.display = "block";
        return this
    }

    invisible(element_id){
        this.id(element_id).style.display = "none";
    }

    visible_change(visible_thing, invisible_thing, funcs=null){
        this.visible(visible_thing);
        this.invisible(invisible_thing);
        if(funcs){
            for(let func of funcs){
                func();
            }
        }
    }

    enabled(element_id){
        this.id(element_id).disabled = true;
        return this;
    }

    disabled(element_id){
        this.id(element_id).disabled = false;
        return this
    }

    click(element_id, func){
        this.id(element_id).addEventListener("click", func);
        return this;
    }

    input(element_id, func){
        this.id(element_id).addEventListener("input", func);
        return this;
    }

    change(element_id, func){
        this.id(element_id).addEventListener("change", func);
        return this;
    }

    async error(msg, target=null){
        if(target == null)target = ERROR_BANNER;
        this.id(target).textContent = msg;
        this.id(target).style.display = 'block';

        await  new Promise(resolve => setTimeout(resolve, 2000));
        this.id(target).textContent = "";
        this.id(target).style.display = 'none';
    }

    content_load(func){
        document.addEventListener("DOMContentLoaded", func);
        return this;
    }

    unload(func){
        window.addEventListener("unload", func);
        return this;
    }

    law(check_type, input_type, err_msg){
        if(this.born(input_type) != check_type){
            throw new Error(err_msg);
        }
        return true;
    }
}

export default function sign(marking=null ,element_id=null){
    let oper = new Operator();
    if(element_id && marking){
        if(Object.prototype.toString.call(marking)    != "[object String]"){throw new Error("Type Error (function sign arg1)");}
        if(Object.prototype.toString.call(element_id) != "[object Array]" ){throw new Error("Type Error (function sign arg2)");}
        oper.sign(marking, element_id);
    }
    return oper;
}

import sign                             from "../operator.js"
import { ABNORMAL_START, ABNORMAL_END } from "../config.js";

export default class Html_Lexer{
    constructor(){
        this.op = sign();
    }

    lex(html){
        this.op.law(String, html, "Type Error (method html_lex arg1)");
        let tag_list = this.tag_splitter(html);
        console.log(tag_list);
        let token    = this.tokenizer(tag_list);
        console.log(token);
        this.op.law(Array, token, "Type Error (method html_lex return)");
        return token;
    }

    #comment_breaker(raw_response){
        this.op.law(String, raw_response, "Type Error (method #comment_breaker arg1)");
        let pure_response = raw_response.replace(/<!--[\s\S]*?-->/g, '');
        this.op.law(String, pure_response, "Type Error (method #comment_breaker return)");
        return pure_response;
    }   

    tag_splitter(html){ // 주성 제거 로직 있어야 함. 
        this.op.law(String, html, "Type Error (method tag_splitter arg1)");
        let tag_list = [];
        let one_tag  = "";
        let tag_flag = 0;
        let inner_txt= 0;
        let abnormal = 0;

        html = this.#comment_breaker(html); // 만약 << 가 발생하는 경우  두 태그의 태그 이름을 추출/ 그리고 근데 조금 애매해서 이상징후 탐지 정도로 해도 될 듯 쿼터랑 <> 이거 abnormal로 처리 
        html = html.replace(/<!DOCTYPE html>/i, "");
        for(let i = 0; html.length > i; i++){
            let arp = html[i];
            if(arp == "<"){    // 태그 밖에서 사용되는 경우와 태그 안에서 사용되는 경우
                inner_txt = 0;
                tag_flag += 1;
                if(one_tag && tag_flag == 1){
                    tag_list.push(one_tag.trim());
                    one_tag = "";
                }
                else if(one_tag && tag_flag == 2){
                    tag_flag -= 1
                    one_tag  = ABNORMAL_START + one_tag;
                    abnormal += 1;
                }
                one_tag += arp;
            }else if(arp == ">"){
                tag_flag -= 1;
                one_tag += arp;
                if(abnormal == 1){
                    one_tag += ABNORMAL_END;
                    abnormal = 0;
                }
                if(tag_flag == -1){
                    tag_flag += 1;
                    let bad = ABNORMAL_START + tag_list.pop();
                    one_tag = bad + one_tag + ABNORMAL_END; 
                }
                tag_list.push(one_tag.trim());
                one_tag = "";
            }else if(tag_flag == 0){
                if(inner_txt  == 0){
                    inner_txt += 1;
                    one_tag   = "";
                }
                one_tag += arp;
            }else{
                one_tag += arp;
            }     
        }
        tag_list = tag_list.filter(Boolean);
        this.op.law(Array, tag_list, "type Error (method tag_splitter return)");
        return tag_list;
    }

    tokenizer(tag_list){
        this.op.law(Array, tag_list, "type Error (method tokenizer arg1)");
        let token    = [];
        
        for(let tag of tag_list){
            if(tag[0] == "<"){
                let tag_tokens = this.#tag_tokenizer(tag);
                for(let tag_token of tag_tokens){
                    token.push(tag_token);
                }
            }
            else{
                if(tag.includes(ABNORMAL_START) && tag.includes(ABNORMAL_END)){
                    let ab_tag = tag.replace(ABNORMAL_START, "").replace(ABNORMAL_END, "");
                    token.push(ABNORMAL_START);
                    token.push(ab_tag);
                    token.push(ABNORMAL_END); 
                }else{token.push(tag);}
            }
        }

        this.op.law(Array, token, "type Error (method tokenizer return)");
        return token
    }

    #tag_tokenizer(tag){
        this.op.law(String, tag, "Type Error (method tag_tokenizer arg1)")
        
        let token         = [];
        let attr_flag     = 0;
        let tag_name_flag = 0;
        let abnormal_flag = 0;
        let attr_quote    = ""; 
        let key_word      = ""; 
        for(let i = 0; tag.length > i; i++){
            let current_word = tag[ i ];
            let back_word    = tag[i+1];
            let bback_word   = tag[i+2] ? tag[i+2] : null; 
            let front_word   = tag[i-1] ? tag[i-1] : null;
            let last_token   = token[token.length-1] ? token[token.length-1] : null;

            if(current_word == "<" && attr_flag == 0){
                if(back_word == "/"){
                    token.push(current_word + back_word);
                    i += 1;
                }else{token.push(current_word);}
                continue;
            }
            if(current_word == "/" && back_word == ">" && attr_flag == 0){
                token.push(current_word + back_word);
                i += 1;
                continue;
            }
            if(current_word == ">" && front_word != "/" && attr_flag == 0){
                if(abnormal_flag == 1){
                    let last_token = token.pop();
                    token.push(last_token + current_word);
                    token.push(ABNORMAL_END);
                    abnormal_flag -= 0;
                }else token.push(current_word); 
                continue;
            }
            if((tag_name_flag == 1 && attr_flag == 0) || ((last_token == "<" || last_token == "</") && attr_flag == 0)){ // 태그 이름이 없어도 abnormal
                if(tag_name_flag == 0){ tag_name_flag += 1;}
                key_word += current_word;
                if(current_word == " " || back_word == ">"){
                    token.push(key_word.trim());
                    key_word      = "";
                    tag_name_flag = 0;
                }
                continue;
            }
            if(attr_flag == 1 || ((current_word == "'" || current_word == "\"" || current_word == "`") && attr_flag == 0)){
                if(attr_flag == 0){
                    if(front_word != "=" && (attr_quote == current_word) && abnormal_flag == 0){
                        abnormal_flag += 1;
                        let re_word = "";
                        for(let i = 0;;i++){
                            let last_token = token.pop()
                            if(last_token == "<"){
                                re_word = last_token + re_word;
                                break;
                            }
                            re_word = last_token + " " + re_word;
                        }
                        token.push(ABNORMAL_START)
                        token.push(re_word);
                        continue;
                    }
                    attr_flag  += 1;
                    attr_quote = "";
                    attr_quote += current_word; 
                    key_word   += current_word;
                    continue;
                }
                key_word += current_word;
                if(current_word == attr_quote){
                    token.push(key_word.trim());
                    key_word   = "";
                    attr_flag  = 0;
                }
                continue;
            }
            if(current_word == "=" && abnormal_flag == 0){
                token.push(current_word);
                continue;
            }
            if(attr_flag == 0 && abnormal_flag == 0){
                key_word += current_word;
                if(back_word == "=" || back_word == ">" || back_word + bback_word == "/>"){
                    token.push(key_word.trim());
                    key_word = "";
                }
                continue;
            }

        }
        token.filter(Boolean);
        this.op.law(Array, token, "Type Error (method tag_tokenizer return)")
        return token;
    }
}
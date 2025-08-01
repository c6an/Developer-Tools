import sign          from "../operator.js";
import Html_Lexer    from "./html_lexer.js";
import { VOID_TAGS, ABNORMAL_START, ABNORMAL_END } from "../config.js";


class Element_Node{
    constructor(tag_name=""){
        this.op         = sign();
        this.tag_name   = null;
        this.attribute  = {};
        this.gparent    = null;
        this.parent     = null;
        this.child      = [];
        this.inline_txt = null;
        this.abnormal   = false;
        this.set_tag_name(tag_name);
    }
    
    set_tag_name(tag){
        this.op.law(String, tag, "Type Error (method set_tag_name arg1)");
        this.tag_name = tag;
        return this;
    }

    set_attribute(attr_key, attr_val){
        this.op.law(String, attr_key, "Type Error (method set_attribute arg1)");
        this.attribute[attr_key] = attr_val;
        return this;
    }

    set_gparent(gparent_node){
        this.gparent = gparent_node;
        return this;
    }
        
    set_parent(parent_node){
        this.parent = parent_node;
        return this;
    }

    set_child(child_node){
        this.child.push(child_node);
        return this;
    }

    set_inline_txt(txt){
        this.inline_txt = txt;
        return this;
    }

    set_abnormal(ab_key, ab_val){
        if(this.abnormal == false){
            this.abnormal = {};
        }
        this.abnormal[ab_key] = ab_val;
        return this;
    }

    find_attr(attr_name){
        this.op.law(String, attr_name, "Type Error (method find attr arg1)");
        return this.attr[attr_name] ? this.attr[attr_name] : null;
    }
}

class Html_Ast extends Html_Lexer{
    constructor(){
        super();
        this.op            = sign();
        this.scope_stack   = [];
        this.abnormal_stack= [];

        this.token         = null;
        this.main          = null;
        this.tags          = {};
        this.attribute     = null;
        this.ast           = null
    }
    
    ast_generator(html){
        this.op.law(String, html, "Type Error (method ast_generator arg1)");
        this.token = this.lex(html);
        this.#parser();
        this.#json_ast();
    }

    ast_load(ast_tree){
        this.op.law(Object, ast_tree, "Type Error (method ast_load arg1)");
        this.ast = ast_tree;
    }

    #tag_exist(tag_name){
        this.op.law(String, tag_name, "Type Error (method #tag_exist arg1)");
        let tag_keys = this.op.keys(this.tags);
        if(tag_keys.length <= 0) return false; 
        if(tag_keys.includes(tag_name))return true;
        return false;
    }

    #tag_update(tag_name, node){
        if(this.#tag_exist(tag_name)){
            this.tags[tag_name].push(node);
        }else{
            this.tags[tag_name] = [];
            this.tags[tag_name].push(node);
        }
        return true;
    }

    #family_setting(target, parent, gparent){
        if(parent != null){
            target.set_parent(parent);
            parent.set_child(target);
        }
        if(gparent != null){
            target.set_gparent(gparent);
        }
        return true;
    }

    #scope_exrv(idx=0){
        return this.scope_stack[this.scope_stack.length - (1 + idx)] ? this.scope_stack[this.scope_stack.length - (1 + idx)] : null;
    }

    #parser(){
        let tokens     = this.token;
        let inline_txt = 0;
        let current_node;

        for(let i = 0; tokens.length > i; i++){
            let current_token = tokens[i];
            let back_token    = tokens[i+1] ? tokens[i+1] : null;
            let bback_token   = tokens[i+2] ? tokens[i+2] : null;

            switch(current_token){
                case "":
                    break;
                case "<":
                    inline_txt       = 0;
                    let node         = new Element_Node(back_token);
                    let back_node    = this.#scope_exrv();
                    let bback_node   = this.#scope_exrv(1);
                    current_node = node;

                    if(!VOID_TAGS.includes(back_token)){
                        this.scope_stack.push(node);
                        if(i == 0){this.main = node;}
                        else{this.#family_setting(node, back_node, bback_node);}
                    }else if(VOID_TAGS.includes(back_token)){this.#family_setting(node, back_node, bback_node);}
                    this.#tag_update(back_token, node);
                    i += 1;
                    break;
                case "</":
                    inline_txt = 0;
                    let back_tag = this.#scope_exrv().tag_name ? this.#scope_exrv().tag_name : null;
                    if(back_tag == back_token){
                        this.scope_stack.pop();
                    }
                    else if(back_tag == "weird_tag"){
                        let ab_node = this.scope_stack.pop();
                        let ab_tag_list = ab_node.abnormal.tag_name;
                        console.log(ab_tag_list)

                        if(!ab_tag_list.includes(back_token) && ab_tag_list.includes(VOID_TAGS)){
                            this.scope_stack.pop();
                        }else{
                            ab_node.set_abnormal("ending_tag", back_token);
                        }
                    }
                    i += 2;
                    inline_txt = 1;
                    break;
                case ">":
                    inline_txt = 1;
                case "/>":
                    inline_txt = 1;
                case ABNORMAL_START:
                    if(bback_token == ABNORMAL_END){
                        let node = new Element_Node("weird_tag");
                        let back_node    = this.#scope_exrv();
                        let bback_node   = this.#scope_exrv(1);
                        this.#family_setting(node, back_node, bback_node);

                        let abnormal_tag_name = this.#abnormal_tag_name_finder(back_token);
                        // this.abnormal_stack.push(node);
                        this.scope_stack.push(node);
                        node.set_abnormal("tag_name", abnormal_tag_name);
                        node.set_abnormal("tag", back_token);
                        node.set_abnormal("ending_tag", null);
                        i += 2;
                    }
                    break;
                default:
                    if(inline_txt == 1){
                        current_node.set_inline_txt(current_token);
                    }else{
                        if(inline_txt == 0 && !current_token.includes("\"") && !current_token.includes("'") && !current_token.includes("`")){
                            // normal attr 
                            if(back_token == "=" && (bback_token.includes("\"") || bback_token.includes("'") || bback_token.includes("`"))){
                                current_node.set_attribute(current_token, bback_token);
                                i += 2;
                            }else if(back_token == "=" && (!bback_token.includes("\"") && !bback_token.includes("'") && !bback_token.includes("`"))){
                                current_node.set_attribute(current_token, "");
                                i += 1
                            }else if(back_token != "="){
                                current_node.set_attribute(current_token, null);
                            }
                        }
                    }
            }
        }
    }

    #abnormal_tag_name_finder(abnormal_tag){
        let start_angle_regexp = new RegExp("<", "g");
        let end_angle_regexp   = new RegExp(">", "g");
        let start_match        = abnormal_tag.match(start_angle_regexp);
        let end_match          = abnormal_tag.match(end_angle_regexp);

        let start_angle        = start_match.length ? start_match.length : 0;
        let end_angle          = end_match.length   ? end_match.length   : 0;
        let flag     = 0;
        let key_word = "";
        let tag_name = [];

        let abnor = abnormal_tag.replace("<", " <");
        for(let i = 0; abnor.length > i; i++){
            let current_word = abnor[i];
            if(flag == 1){
                if(current_word == " "){
                    flag = 0;
                    tag_name.push(key_word);
                    key_word = ""
                    continue;
                }
                key_word += current_word;
            }
            if(current_word == "<"){flag = 1;}
        }

        return tag_name;
    }

    #json_ast(){
        let dict = this.#to_dict(this.main);
        let ast  = {"main" : dict};
        ast      = JSON.stringify(ast);
        this.ast = ast
        console.log(ast)
    }

    #to_dict(node){
        let dict = {};
        dict[ "nodeType" ] = "element";
        dict[ "tagName"  ] = node.tag_name;
        dict["attribute" ] = Object.assign({}, node.attribute);
        dict["inlineText"] = node.inline_txt;
        dict[ "abnormal" ] = node.abnormal;
        dict[   "child"  ] = [];
        if(node.child.length > 0){
            for(let child_node of node.child){ dict["child"].push(this.#to_dict(child_node)); }
        }
        return dict;
    }


}


let html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta <as charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Popup 2 - XSS Filter Visualizer</title>
    <meta name="hidden-input" content="2" />
    <link rel="stylesheet" href="./popup2.css" />
</head>
<body>
<div class="container">
    <!-- Header -->
    <div class="header">
        <button id="back-button" class="back-button">
            ←
        </button>
        <div class="title">XSS Filter Visualizer</div>
    </div>

    <!-- Stats (예시) -->
    <div class="stats">
        <div class="stat-card">
            <div class="stat-number" id="total-te"sts">0</div>
            <div class="stat-label">총 테스트</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" id="vuln-found">0</div>
            <div class="stat-label">취약점> 발견</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" id="filtered">0</div>
            <div class="stat-label">필터링 됨</div>
        </div>
    </div>

    <!-- Dynamic Params Sections -->
    <div class="result-section" id="result-section">
        <!-- 여기에 각 파라미터별로 섹션을 추가 -->
    </div>

    <!-- 다시 스캔할 경우 입력란 -->
    <div class="input-section">
        <label for="test-param" class="input-label">
            테스트 파라미터 <span class="required">*</span>
        </label>
        <input
                type="text"
                id="test-param"
                class="input-field"
                placeholder="q, search"
        />
        <button id="start-scan" class="scan-button">스캔 시작</button>

        <div id="errorBanner" class="error-banner"></div>
    </div>
</div>
<script type="module" src="./popup2.js"></script>

<ft-res></ft-res>
</body>
</html>`

let a = new Html_Ast();
let token = a.ast_generator(html);



// {
//     "main":{
//         "nodeType":"element",
//         "tagName":"html",
//         "attribute":{
//             "lang":"\"ko\""
//         },
//         "inlineText":null,
//         "abnormal":false,
//         "child":[
//             {
//                 "nodeType":"element",
//                 "tagName":"head",
//                 "attribute":{},
//                 "inlineText":null,
//                 "abnormal":false,
//                 "child":[
//                     {
//                         "nodeType":"element",
//                         "tagName":"",
//                         "attribute":{},
//                         "inlineText":null,
//                         "abnormal":{
//                             "tag":"<meta< charset=\"UTF-8\" />",
//                             "ending_tag":null
//                         },
//                         "child":[]
//                     },
//                     {
//                         "nodeType":"element",
//                         "tagName":"meta",
//                         "attribute":{
//                             "name":"\"viewport\"",
//                             "content":"\"width=device-width, initial-scale=1.0\""
//                         },
//                         "inlineText":null,
//                         "abnormal":false,
//                         "child":[]
//                     },
//                     {
//                         "nodeType":"element",
//                         "tagName":"title",
//                         "attribute":{},
//                         "inlineText":"Popup 2 - XSS Filter Visualizer",
//                         "abnormal":false,
//                         "child":[]
//                     },
//                     {
//                         "nodeType":"element",
//                         "tagName":"meta",
//                         "attribute":{
//                             "name":"\"hidden-input\"",
//                             "content":"\"2\""
//                         },
//                         "inlineText":null,
//                         "abnormal":false,
//                         "child":[]
//                     },
//                     {
//                         "nodeType":"element",
//                         "tagName":"link",
//                         "attribute":{
//                             "rel":"\"stylesheet\"",
//                             "href":"\"./popup2.css\""
//                         },
//                         "inlineText":null,
//                         "abnormal":false,
//                         "child":[]
//                     }
//                 ]
//             },
            
//             {
//                 "nodeType":"element",
//                 "tagName":"body",
//                 "attribute":{},
//                 "inlineText":null,
//                 "abnormal":false,
//                 "child":[
//                     {
//                         "nodeType":"element",
//                         "tagName":"div",
//                         "attribute":{
//                             "class":"\"container\""
//                         },
//                         "inlineText":null,
//                         "abnormal":false,
//                         "child":[
//                             {
//                                 "nodeType":"element",
//                                 "tagName":"div",
//                                 "attribute":{
//                                     "class":"\"header\""
//                                 },
//                                 "inlineText":null,
//                                 "abnormal":false,
//                                 "child":[
//                                     {
//                                         "nodeType":"element",
//                                         "tagName":"button",
//                                         "attribute":{
//                                             "id":"\"back-button\"",
//                                             "class":"\"back-button\""
//                                         },
//                                         "inlineText":"←",
//                                         "abnormal":false,
//                                         "child":[]
//                                     },
                                    
//                                     {
//                                         "nodeType":"element"
//                                         ,"tagName":"div",
//                                         "attribute":{
//                                             "class":"\"title\""
//                                         },
//                                         "inlineText":"XSS Filter Visualizer"
//                                         ,"abnormal":false,
//                                         "child":[]
//                                     }
//                                 ]
//                             }
                            
//                             ,
//                             {
//                                 "nodeType":"element"
//                                 ,"tagName":"div"
//                                 ,"attribute":{
//                                     "class":"\"stats\""
//                                 }
//                                 ,
//                                 "inlineText":null,
//                                 "abnormal":false,
//                                 "child":[
//                                     {
//                                         "nodeType":"element",
//                                         "tagName":"div",
//                                         "attribute":{
//                                             "class":"\"stat-card\""
//                                         },
//                                         "inlineText":"0",
//                                         "abnormal":false,
//                                         "child":[
//                                             {
//                                                 "nodeType":"element",
//                                                 "tagName":"","attribute":{},
//                                                 "inlineText":null,
//                                                 "abnormal":{
//                                                     "tag":"< div class = \"stat-number\" id = \"total-te\" >",
//                                                     "ending_tag":"div"
//                                                 },
//                                                 "child":[]
//                                             }
//                                         ]
//                                     }
                                    
//                                     ,{ //========================================================================================= 여기 문제 발견 
//                                         "nodeType":"element",
//                                         "tagName":"div",
//                                         "attribute":{
//                                             "class":"\"stat-label\""
//                                         },
//                                         "inlineText":"총 테스트",
//                                         "abnormal":false,
//                                         "child":[]
//                                     }
//                                 ]
//                             }
                            
//                             ,{
//                                 "nodeType":"element",
//                                 "tagName":"div",
//                                 "attribute":{
//                                     "class":"\"stat-card\""
//                                 },
//                                 "inlineText":null,
//                                 "abnormal":false,
//                                 "child":[
//                                     {
//                                         "nodeType":"element",
//                                         "tagName":"div",
//                                         "attribute":{
//                                             "class":"\"stat-number\"",
//                                             "id":"\"vuln-found\""
//                                         },
//                                         "inlineText":"발견",
//                                         "abnormal":false,
//                                         "child":[]
//                                     },
                                    
//                                     {
//                                         "nodeType":"element",
//                                         "tagName":"",
//                                         "attribute":{},
//                                         "inlineText":null,
//                                         "abnormal":{
//                                             "tag":"<div class=\"stat-label\">취약점>",
//                                             "ending_tag":"div"
//                                         },
//                                         "child":[]
//                                     }
//                                 ]
//                             }
//                         ]
//                     }
//                     ,{
//                         "nodeType":"element",
//                         "tagName":"div",
//                         "attribute":{
//                             "class":"\"stat-card\""
//                         },
//                         "inlineText":null,
//                         "abnormal":false,
//                         "child":[
//                             {
//                                 "nodeType":"element",
//                                 "tagName":"div",
//                                 "attribute":{
//                                     "class":"\"stat-number\"",
//                                     "id":"\"filtered\""
//                                 },
//                                 "inlineText":"0",
//                                 "abnormal":false,
//                                 "child":[]
//                             },
//                             {
//                                 "nodeType":"element",
//                                 "tagName":"div",
//                                 "attribute":{
//                                     "class":"\"stat-label\""
//                                 },
//                                 "inlineText":"필터링 됨",
//                                 "abnormal":false,
//                                 "child":[]
//                             }
//                         ]
//                     }
//                     ,{
//                         "nodeType":"element",
//                         "tagName":"div",
//                         "attribute":{
//                             "class":"\"result-section\"",
//                             "id":"\"result-section\""
//                         },
//                         "inlineText":null,
//                         "abnormal":false,
//                         "child":[]
//                     },
                    
//                     {
//                         "nodeType":"element",
//                         "tagName":"div",
//                         "attribute":{
//                             "class":"\"input-section\""
//                         },
//                         "inlineText":null,
//                         "abnormal":false,
//                         "child":[
//                             {
//                                 "nodeType":"element",
//                                 "tagName":"label",
//                                 "attribute":{
//                                     "for":"\"test-param\"",
//                                     "class":"\"input-label\""
//                                 },
//                                 "inlineText":"테스트 파라미터",
//                                 "abnormal":false,
//                                 "child":[
//                                     {
//                                         "nodeType":"element",
//                                         "tagName":"span",
//                                         "attribute":{
//                                             "class":"\"required\""
//                                         },
//                                         "inlineText":"*",
//                                         "abnormal":false,
//                                         "child":[]
//                                     }
//                                 ]
//                             }
//                             ,{
//                                 "nodeType":"element",
//                                 "tagName":"input",
//                                 "attribute":{
//                                     "type":"\"text\"",
//                                     "id":"\"test-param\"",
//                                     "class":"\"input-field\"",
//                                     "placeholder":"\"q, search\""
//                                 },
//                                 "inlineText":null,
//                                 "abnormal":false,
//                                 "child":[]
//                             },
//                             {
//                                 "nodeType":"element",
//                                 "tagName":"button",
//                                 "attribute":{
//                                     "id":"\"start-scan\"",
//                                     "class":"\"scan-button\""
//                                 },
//                                 "inlineText":"스캔 시작",
//                                 "abnormal":false,
//                                 "child":[]
//                             },
//                             {
//                                 "nodeType":"element",
//                                 "tagName":"div",
//                                 "attribute":{
//                                     "id":"\"errorBanner\"",
//                                     "class":"\"error-banner\""
//                                 },
//                                 "inlineText":null,
//                                 "abnormal":false,
//                                 "child":[]
//                             }
//                         ]
//                     }
//                     ,
//                     {
//                         "nodeType":"element"
//                         ,"tagName":"script"
//                         ,"attribute":{
//                             "type":"\"module\"",
//                             "src":"\"./popup2.js\""
//                         },
//                         "inlineText":null,
//                         "abnormal":false,
//                         "child":[]
//                     },
//                     {
//                         "nodeType":"element",
//                         "tagName":"ft-res",
//                         "attribute":{},
//                         "inlineText":null,
//                         "abnormal":false,
//                         "child":[]
//                     }
//                 ]
//             }
//         ]
//     }
// }

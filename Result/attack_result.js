import sign                              from "../lib/operator.js";
import { left_icon, down_icon, msg_stl } from "./result_config.js";



class Attack_Result{
    constructor(){
        this.op = sign();
        this.main        = null;
        this.pay_section = null;
        this.pay_item    = null;
        this.raw_section = null;
        this.raw_code    = null;
        this.arrow       = null;
        this.copy_btn    = null;
        this.raw_data_el = null;

        this.#config();
    }

    #config(){
        this.#default_element_generator();
    }

    #default_element_generator(){
        this.main = this.op.gen("div", {"class" : "analysis-item"});
        this.#pay_section_generator();
        this.#raw_section_generator();
        this.#default_click();
        this.#raw_copy();
    }

    #pay_section_generator(){
        this.pay_section = this.op.gen("div",  {"class" : "payload-header"});
        this.pay_item    = this.op.gen("span", {"class" : "payload-text", "id" : "payload-text"});
        this.arrow        = this.op.gen("span", {"class" : "arrow"});
        let toggle       = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        let icon         = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        icon.setAttribute("d", "m18.03 2.26-14.02 8c-1.34.77-1.34 2.72 0 3.48l14.02 8C19.36 22.5 21 21.53 21 20V4c0-1.53-1.64-2.5-2.97-1.74");
        toggle.setAttributeNS(null, "viewBox", "0 0 24 24");
        toggle.setAttribute("xmlns", "http://www.w3.org/2000/svg")
        toggle.setAttribute("width", "24" )
        toggle.setAttribute("height", "24")
        toggle.setAttribute("fill", "currentColor")
        toggle.setAttribute("class", "mi-solid mi-triangle-left")

        toggle.appendChild(icon);
        this.arrow.appendChild(toggle);
        this.op.appends(this.pay_section, [this.pay_item, this.arrow])
        this.op.append(this.main, this.pay_section);
    }

    #raw_section_generator(){
        const svgNS = "http://www.w3.org/2000/svg";
        this.raw_section = this.op.gen("div"   , {"class"   : "raw-data-section hidden"}); // 1
        this.raw_code    = this.op.gen("code"  , {"id"      : "raw_code"});
        let sec_group    = this.op.gen("div"   , {"class"   : "raw-data-container"}) // 2
        let deg_group    = this.op.gen("div"   , {"class"   : "raw-data-header"})
        this.copy_btn     = this.op.gen("button", {"class"   : "copy-btn"})
        let raw_deg      = document.createElementNS(svgNS, "svg");

        let raw_deg_path = document.createElementNS(svgNS, "path"); 
        this.raw_data_el = this.op.gen("pre"   , {"class"   : "raw-data-content", "id" : "rawData"})

        raw_deg.setAttribute("width", "16");
        raw_deg.setAttribute("height", "16");
        raw_deg.setAttribute("viewBox", "0 0 24 24");
        raw_deg.setAttribute("fill", "currentColor");
        raw_deg_path.setAttribute("d", "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z");

        deg_group.innerText = "Raw Value";
        raw_deg.appendChild(raw_deg_path)
        this.copy_btn.appendChild(raw_deg)
        this.op.append(deg_group   , this.copy_btn);
        this.op.append(this.raw_data_el, this.raw_code);
        this.op.appends(sec_group, [deg_group, this.raw_data_el]);
        this.op.append(this.raw_section, sec_group);
        this.op.append(this.main, this.raw_section);
    }
    
    #default_click(){
        let arrow = this.arrow
        this.pay_section.addEventListener("click", ()=>{
            let raw_section  = this.raw_section
            raw_section.classList.toggle('hidden');
            arrow.innerHTML = raw_section.classList.contains('hidden') ? left_icon : down_icon;
        })
    }

    data_push(payload, param, host, response){
        this.payload_display(payload);
        this.raw_display(param, host, response);
        return this;
    }

    payload_display(payload){
        this.pay_item.innerText = payload;
        return this;
    }

    raw_display(param, host, response){
        let data = "GET " + param;
        data += "\nHost: " + host;
        data += "\n\nResponse:\n" + response;
        this.raw_code.innerText = data;
        return this;
    }

    attach(target){
        this.op.append(target, this.main);
    }

    flash_message(message){
        let msgEl = this.op.gen("div"); 
        this.op.apear(msgEl, msg_stl);
        msgEl.textContent = message;
        document.body.appendChild(msgEl);
        setTimeout(() => {
            msgEl.style.opacity = '0';
            setTimeout(()=>{document.body.removeChild(msgEl);}, 500);}, 1000);
    }

    #raw_copy(){
        let data_element = this.raw_data_el;
        this.copy_btn.addEventListener('click',()=>{
            let raw_data = data_element.textContent.trim();
            navigator.clipboard.writeText(raw_data)
            .then(()=> this.flash_message('원본 데이터 복사 완료'))
            .catch((err) => {
                console.error(err);
                this.flash_message('복사 실패');
            });
        }
        )
    }
}

export default function atk_gen(payload, param, host, response){
    let element = new Attack_Result();
    element.data_push(payload, param, host, response);
    return element;
}
//result.js
import sign                           from "../lib/operator.js";
import atk_gen                        from "./attack_result.js";
import { ATTACK_RESULT, ATTACK_DATA } from "../lib/config.js";
import { Recver }                     from "../lib/messegeController.js";

const op             = sign();
const PAYLOAD        = "payload";
const PARAM          = "param";
const HOST           = "url";
const RESPONSE       = "response";
const TOTAL          = 'total';
const VULN           = "vuln";
const TARGET         = "target";

class Result_Page{
    static run_factory(){
        const page       = new Result_Page();
        const res_recver = new Recver();

        res_recver.recv(ATTACK_RESULT, [(msg)=>{page.result_update(msg[ATTACK_DATA]);}])
        op.click("print", ()=>{window.print();});
        op.click("close", ()=>{window.close();});
        op.click("clear", ()=>{op.print("search", ""); filterAnalysisItem('');});
        op.click("share", ()=>{
            navigator.clipboard.writeText(window.location.href).then(() => {showTemporaryMessage('URL 복사 완료');})
            .catch(() => {showTemporaryMessage('URL 복사 실패');});
        })
    }

    constructor(){this.res_list = [];}

    result_update(msg){
        op.print("target_param", "Parameter: " + msg[TARGET]);
        let res = atk_gen(msg[PAYLOAD], msg[PARAM], msg[HOST], msg[RESPONSE]);
        this.res_list.push(res);
        res.attach("analyze");
        this.#count_add(TOTAL);
        this.#count_add(VULN);
    }

    #count_add(target){
        let count = Number(op.scan(target));
        op.print(target, count + 1);
        return true;
    }
}
Result_Page.run_factory();

function filterAnalysisItem(query){ //검색 기능
    const items = document.querySelectorAll('.analysis-item');
    const lowerQuery = query.toLowerCase();
    let visibleCount = 0;

    items.forEach(item => {
        const payload = item.querySelector('.payload-text')?.textContent.toLowerCase() || '';
        const raw = item.querySelector('.raw-data-content')?.textContent.toLowerCase() || '';
        const combined = payload + ' ' + raw;

        if (combined.includes(lowerQuery)) {
            item.style.display = 'block';
            visibleCount++;
        }else{ item.style.display = 'none';}
    });
    op.id("no-result-message").style.display = visibleCount === 0 ? 'block' : 'none';
}

op.input("search", ()=>{filterAnalysisItem(op.scan("search"));});
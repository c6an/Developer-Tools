import Dom_Storage        from "./dom_storage.js";
import { OBSERV_DATA }    from "./config.js";
import Storage_Controller from "./storageController.js";


export default class Dom_Observer extends Dom_Storage{
    constructor(){
        super();
        this.sc  = new Storage_Controller();
        this.sub_html;
        this.sub_url;
        this.mode = false;
    }

    async operated(){
        if(this.exist())await this.destroy();
        let stat = {[OBSERV_DATA] : {"status" : true}}
        await this.sc.save(stat);
        this.mode = true;
        return this;
    }

    async deoperated(){
        await this.sc.remove(OBSERV_DATA);
        this.mode = false;
        return this;
    }

    async exist(){
        let observ_obj = await this.sc.load(OBSERV_DATA);
        if(observ_obj == undefined) return false;
        try{
            let stat   = observ_obj[OBSERV_DATA]["status"];
            return stat;
        }catch(err){
            return false;
        }
    }

    async destroy(){
        await this.sc.remove(OBSERV_DATA);
        return this;
    }

}// 알던 데이터 확인 
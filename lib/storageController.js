export default class Storage_Controller {
    async save(data){
        if(Object.prototype.toString.call(data) != "[object Object]"){throw new Error("Type Error (method save arg1)");}
        return new Promise((resolve, reject)=>{
            chrome.storage.local.set(data, ()=>{
                if(chrome.runtime.lastError){
                    reject(chrome.runtime.lastError);
                }else{
                    resolve();
                }
            })
        })
    }

    async load(key){
        let result = await new Promise((resolve)=>{
            chrome.storage.local.get(key, (res)=>{
                resolve(res);
            })
        })
        return result;
    }

    async remove(key){
        return new Promise((resolve, reject)=>{
            chrome.storage.local.remove(key, ()=>{
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            })
        })
    }

    async clear(){
        return new Promise((resolve, reject)=>{
            chrome.storage.local.clear(()=>{
                if(chrome.runtime.lastError){
                    reject(chrome.runtime.lastError);
                }else{
                    resolve();
                }
            })
        })
    }

    session_set(data){
        sessionStorage.setItem(data, true);
        return this;
    }

    session_get(data){
        return sessionStorage.getItem(data);
    }
}
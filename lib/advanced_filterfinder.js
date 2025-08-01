import Filter_Finder from "./filterfinder.js";

export default class Advance_Filter_Finder extends Filter_Finder{
    constructor(){
        super();
    }

    async filter_factory(url, param, delay, cookie=true, headers=null){
        await this.filter_checking(url, param, delay, cookie, headers);
    }
}
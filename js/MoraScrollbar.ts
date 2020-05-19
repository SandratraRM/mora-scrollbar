class Mora_ScrollBar{

    private wrappers: HTMLCollectionOf<Element>;
    private initial_cursor:any = 0;
    private current_element: any;
    private scrollers: any;
    private default_pointerup:Function | null;
    private default_pointermove: Function | null;
    private default_pointercancel: Function | null;
    private initial_top: number = 0;

    constructor(){ 
        
        this.current_element = null;
        this.wrappers = document.getElementsByClassName("msc-wrapper");
        this.scrollers = document.getElementsByClassName("msc-handle");
        this.default_pointerup = window.onpointerup;
        this.default_pointermove = window.onpointermove;
        this.default_pointercancel = window.onpointercancel;
        window.addEventListener("resize",(event)=>{this.refresh();});
    }

    public createElement() {
        const wrapper = document.createElement("DIV") ,content = document.createElement("DIV");
        wrapper.classList.add("msc-wrapper");
        content.classList.add("msc-content");
        wrapper.appendChild(content);
        return wrapper;
    }

    private _render(){
        for (var s = 0; s < this.scrollers.length; s++) {
            const handle = this.scrollers[s];
            const content = handle.parentElement.parentElement.previousElementSibling;
            const wrapper = content.parentElement;
            const arrow_down = wrapper.lastChild.lastChild;
            const arrow_up = wrapper.lastChild.firstChild;
            
            let scroll_width = (content.offsetWidth - content.clientWidth);
            if (scroll_width > 0) {
                
                if (content.offsetHeight == content.scrollHeight) {
                    handle.parentElement.parentElement.style.display = "none";
                }
                else if (content.offsetHeight < content.scrollHeight) {
                    handle.parentElement.parentElement.style.display = "block";
                }
                const initial_height = handle.parentElement.offsetHeight * this._calculateHeight({element: content}) / 100;
                handle.style.height = initial_height + "px";
                const top = ((content.scrollTop / (content.scrollHeight - content.offsetHeight)) * (handle.parentElement.clientHeight - handle.offsetHeight));
                handle.style.top = top+ "px";
                
            
                if (content.scrollTop == 0) {
                    arrow_up.classList.add("disabled");
                }else{
                    arrow_up.classList.remove("disabled");
                }
                if (content.scrollTop == content.scrollHeight - content.offsetHeight) {
                    arrow_down.classList.add("disabled");
                }else{
                    arrow_down.classList.remove("disabled");
                }
            
            }
            else{
                handle.parentElement.parentElement.style.display = "none";
            }
        }
    }

    public _calculateHeight(parameters: { element: any }) {
        let element = parameters.element;
        return (element.offsetHeight / element.scrollHeight) * 100;
    }
    public refresh(){
        this.remove_scrollbars();
        if (this._hasScrollbars()) {
            this._addScrollbar();
        }
    }
    private _hasScrollbars(){
        
        const test = document.createElement("div");
        test.style.position = "absolute";
        test.style.overflowY = "scroll";
        
        test.style.height = "100%";
        test.style.width = "100%";
        test.style.boxSizing ="border-box";
        test.id= "msc-tester";
        document.body.appendChild(test);
        const has_scrollbar = ((test.offsetWidth - test.clientWidth) > 0);
        document.body.removeChild(test);
        return has_scrollbar;

    }
    private _addScrollbar(){
        const _Mora_ScrollBar = this;
        for (let i =0; i < this.wrappers.length;i++){
            const wrapper = this.wrappers[i];
            const content = wrapper.getElementsByClassName("msc-content")[0];
          if(content.nextElementSibling == null){
              //@ts-ignore
            content.addEventListener("scroll",()=>{this._render()});
            content.addEventListener("resize",()=>{this._render()});
            const track = document.createElement("DIV");
            track.classList.add("msc-track");
            const handle = document.createElement("BUTTON");
            handle.classList.add("msc-handle");
            handle.addEventListener("pointerdown",function (event) {
                _Mora_ScrollBar.startScroll(event,handle);
            });
            track.addEventListener("click",function (event){
                _Mora_ScrollBar.jumpTo(event,track);
            });
            track.appendChild(handle);
            const scrollbar = document.createElement("DIV");
            scrollbar.classList.add("msc-scrollbar");
            const arrow_up = document.createElement("BUTTON");
            const arrow_down = document.createElement("BUTTON");
            arrow_up.classList.add("msc-btn-up");
            arrow_down.classList.add("msc-btn-down");
            let upInt:any;
            arrow_up.onpointerdown = ()=>{
                upInt = setInterval(()=>{
                this._arrow_scroll(content,-1);
                },1);
            }
            arrow_up.onpointerup = arrow_up.onpointerout = ()=>{
                clearInterval(upInt);
            }
            let downInt:any;
            
            arrow_down.onpointerdown = ()=>{
                downInt = setInterval(()=>{
                this._arrow_scroll(content,1);
                },1);
            }
            arrow_down.onpointerup = arrow_down.onpointerout = ()=>{
                clearInterval(downInt);
            }
            
            scrollbar.appendChild(arrow_up);
            scrollbar.appendChild(track);
            scrollbar.appendChild(arrow_down);
            
            wrapper.appendChild(scrollbar);
          }
        };
        this._render();
    }

    private startScroll(event:any,element:any){
        document.body.parentElement!.style.touchAction  = "none";
        this.stopScroll();
        const _Mora_ScrollBar = this;
        _Mora_ScrollBar.initial_cursor = event.clientY;
        _Mora_ScrollBar.current_element = element;
        _Mora_ScrollBar.initial_top = element.offsetTop;
        element.parentElement.parentElement.parentElement.classList.add("using-scroll");
        document.body.style.userSelect = document.body.style.webkitUserSelect = document.body.style.msUserSelect = "none";

        this.default_pointermove = window.onpointermove;
        window.onpointermove = function (event: any){
            _Mora_ScrollBar.pointerScroll(event);
            if (_Mora_ScrollBar.default_pointermove != null) {
               (_Mora_ScrollBar.default_pointermove.bind(this))(event);
            }
        }

        this.default_pointerup = window.onpointerup;
        window.onpointerup = function (event: any){
            _Mora_ScrollBar.stopScroll();
            if (_Mora_ScrollBar.default_pointerup != null) {
                (_Mora_ScrollBar.default_pointerup.bind(this))(event);
            }
        }

        this.default_pointercancel = window.onpointercancel;
        window.onpointercancel = function (event: any){
            _Mora_ScrollBar.stopScroll();
            if (_Mora_ScrollBar.default_pointercancel != null) {
                (_Mora_ScrollBar.default_pointercancel.bind(this))(event);
            }
        }
    }

    private stopScroll() {
        const _Mora_ScrollBar = this;
        const using = document.getElementsByClassName("using-scroll")[0];
        if (using != null) {
            using.classList.remove("using-scroll");
        }
        document.body.parentElement!.style.touchAction  = "";
        document.body.style.userSelect = document.body.style.webkitUserSelect = document.body.style.msUserSelect = "";
        window.onpointermove = _Mora_ScrollBar.default_pointermove as any | null;
        window.onpointerup = _Mora_ScrollBar.default_pointerup as any | null;
        window.onpointercancel = _Mora_ScrollBar.default_pointercancel as any | null;
    }

    private remove_scrollbars(){
        for (let index = 0; index < this.wrappers.length; index++) {
            //@ts-ignore
            const content = this.wrappers[index].getElementsByClassName("msc-content")[0];
            //@ts-ignore
            let scroll_width = (content.offsetWidth - content.clientWidth) + 1;
            //@ts-ignore
            content.style.marginRight ="-" +scroll_width+ "px";
            //@ts-ignore
            content.style.width = "calc(100% + "+ scroll_width + "px)";
            
        }

    }
    private pointerScroll(event:any){
        const _Mora_ScrollBar = this;
        const pointer_Y = event.clientY;
        const element = this.current_element;
        const percent = (this.initial_top / (element.parentElement.offsetHeight - element.offsetHeight) ) + ((pointer_Y - _Mora_ScrollBar.initial_cursor) /( element.parentElement.offsetHeight - element.offsetHeight));
        const cible = element.parentElement.parentElement.previousElementSibling;
        cible.scrollTop = percent * (cible.scrollHeight - cible.offsetHeight);
    }
    private jumpTo(event:any, element:any){
        if (event.target == element) {
            
            const Y = event.clientY;
            const cible = element.parentElement.parentElement.getElementsByClassName("msc-content")[0];
            const handle = element.lastChild;
            if (Y <= handle.getBoundingClientRect().top + handle.offsetHeight) {
                this.nextPage(cible,-1)

            }else{
                this.nextPage(cible,1);
            }
        }
    }
    
    private nextPage(element:any,direction:any){
        const initial_top = element.scrollTop;
        const final_top = initial_top + (element.offsetHeight * direction);
        const interval = setInterval(()=>{
            element.scrollTop += (element.offsetHeight * direction)/10;
            if (direction > 0 && element.scrollTop >= final_top || direction < 0 && element.scrollTop <= final_top || element.scrollTop == 0 || element.scrollTop == element.scrollHeight - element.offsetHeight) {
                clearInterval(interval);
                element.scrollTop = final_top;
            }
        },30);

    }
    
    private _arrow_scroll(cible:any,value:Number){
        cible.scrollTop = cible.scrollTop + value;
    }
}

var MoraScrollbar;
window.addEventListener("load" ,()=>{
    MoraScrollbar = new Mora_ScrollBar();
    MoraScrollbar.refresh();
});
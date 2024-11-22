'use strict'
import './index.scss'
import { moraScrollBarConf } from "./configuration";
import { createElement } from "./utils/element";

class Scrollbar {
    private targetWrapper: HTMLElement;
    private targetContent: HTMLElement;
    private scrollbarElement: HTMLElement;
    private track: HTMLElement;
    private handle: HTMLElement;
    private buttonUp: HTMLElement;
    private buttonDown: HTMLElement;
    private onInitListeners: { target: Window | HTMLElement, event: string, callback: (event: Event) => void }[] = []
    private onScrollListeners: { event: string, callback: (event: Event) => void }[] = []
    private enabled: boolean = true;

    constructor(wrapper: Wrapper) {
        this.scrollbarElement = createElement(moraScrollBarConf.scrollbar);
        // Fix selection bug 
        this.scrollbarElement.style.userSelect = this.scrollbarElement.style.webkitUserSelect = (this.scrollbarElement.style as any).msUserSelect = "none";

        this.targetWrapper = wrapper.getWrapper();
        this.targetContent = wrapper.getContent() as HTMLElement;
        this.handle = createElement(moraScrollBarConf.scrollbar.handle);
        this.track = createElement(moraScrollBarConf.scrollbar.track);
        this.track.appendChild(this.handle);
        // Create buttons 
        this.buttonUp = createElement(moraScrollBarConf.scrollbar.buttonUp);
        this.buttonDown = createElement(moraScrollBarConf.scrollbar.buttonDown);
        this.scrollbarElement.append(this.track, this.buttonUp, this.buttonDown);
        this.targetWrapper.appendChild(this.scrollbarElement);
        this._setEvents();
    }

    private _setEvents() {
        this._setTrackEvents();
        this._setHandleEvents();
        this._setButtonsEvents();
    }



    private _setTrackEvents() {
        this._submitOnInitListener(this.track, "click", (event: Event) => {
            this._onTrackClick(event as PointerEvent);
        })
    }

    private _setHandleEvents() {
        this._submitOnInitListener(this.handle, "pointerdown", (event: Event) => {
            this._startMeasuringScroll(event);
        })
    }

    private _setButtonsEvents() {
        const setupButton = (element: HTMLElement, increase: number) => {
            let interval: NodeJS.Timeout;
            element.onpointerdown = () => {
                interval = setInterval(() => {
                    this._buttonScroll(this.targetContent, increase);
                }, 1);
            }
            element.onpointerup = element.onpointerout = () => {
                clearInterval(interval);
            }
        }
        setupButton(this.buttonUp, -1);
        setupButton(this.buttonDown, 1);
    }

    private _buttonScroll(targetElement: HTMLElement, value: number) {
        targetElement.scrollTop = targetElement.scrollTop + value;
    }

    private _submitOnScrollListener(eventName: string, callback: (event: Event) => void) {
        this.onScrollListeners.push({ event: eventName, callback })
        window.addEventListener(eventName, callback);
    }

    private _submitOnInitListener(
        target: Window | HTMLElement,
        eventName: string, callback: (event: Event) => void
    ) {
        this.onInitListeners.push({ target, event: eventName, callback })
        target.addEventListener(eventName, callback);
    }

    private _startMeasuringScroll(event: Event) {
        this._stopMeasuringScroll();
        this.targetWrapper.classList.add("msc-using-scroll");
        const stopScrollCallback = (event: Event) => {
            this._stopMeasuringScroll();
        }
        this._submitOnScrollListener("pointercancel", stopScrollCallback);
        this._submitOnScrollListener("pointerup", stopScrollCallback);


        const initials = {
            top: this.handle.offsetTop,
            cursor: (event as PointerEvent).clientY
        }
        const doScrollCallback = (event: Event) => {
            this._doScrollOnPointerMove(event as PointerEvent, initials);
        }
        this._submitOnScrollListener("pointermove", doScrollCallback);

    }

    private _stopMeasuringScroll() {
        this.targetWrapper.classList.remove("msc-using-scroll");
        while (this.onScrollListeners.length > 0) {
            const listener = this.onScrollListeners.shift();
            if (listener) {
                window.removeEventListener(listener.event, listener.callback);
            }
        }
    }

    private _doScrollOnPointerMove(event: PointerEvent, initials: { top: number, cursor: number }) {
        const target = this.targetContent;
        const handle = this.handle;
        const track = this.track;
        const pointer_Y = event.clientY;
        const percent = (initials.top / (track.offsetHeight - handle.offsetHeight)) +
            ((pointer_Y - initials.cursor) / (track.offsetHeight - handle.offsetHeight));

        target.scrollTop = percent * (target.scrollHeight - (target as any as HTMLElement).offsetHeight);
    }

    private _jumpPageBy(direction: number) {
        const element = this.targetContent;
        const initialTop = element.scrollTop;
        const finalTop = initialTop + (element.offsetHeight * direction);
        if (typeof Element.prototype.scrollTo === 'function') {
            element.scrollTo({
                top: finalTop,
                left: 0,
                behavior: 'smooth'
            });
        }
    }
    private _onTrackClick(event: PointerEvent) {
        if (event.target === this.track) {
            const clientY = event.clientY;
            if (clientY <= this.handle.getBoundingClientRect().top + this.handle.offsetHeight) {
                this._jumpPageBy(-1)
            } else {
                this._jumpPageBy(1);
            }
        }
    }
    public renderDisplayAndPosition() {

        // set mora scrollbar display
        this.scrollbarElement.style.display = this.enabled && this.targetContent.offsetHeight < this.targetContent.scrollHeight ?
            "block" : "none";

        // set handle height
        this.handle.style.height = `${this.track.offsetHeight * (this.targetContent.offsetHeight / this.targetContent.scrollHeight)}px`;

        // set handle top postion
        const invisibleContentHeight = this.targetContent.scrollHeight - this.targetContent.offsetHeight;
        const handleTrackRoom = this.track.clientHeight - this.handle.offsetHeight;
        this.handle.style.top = `${this.targetContent.scrollTop * handleTrackRoom / invisibleContentHeight}px`;


        // set button classes
        if (this.targetContent.scrollTop == 0) {
            this.buttonUp.classList.add("disabled");
        } else {
            this.buttonUp.classList.remove("disabled");
        }
        if (this.targetContent.scrollTop == this.targetContent.scrollHeight - this.targetContent.offsetHeight) {
            this.buttonDown.classList.add("disabled");
        } else {
            this.buttonDown.classList.remove("disabled");
        }
    }
    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }
    public onDestroy(){
        this.onInitListeners.forEach(listener => {
            listener.target.removeEventListener(listener.event, listener.callback);
        });
        this.targetWrapper.removeChild(this.scrollbarElement);
    }
}

class Wrapper {
    private wrapperElement: HTMLElement;
    private content: HTMLElement;
    private scrollbar?: Scrollbar;
    private enabled: boolean = true;
    private contentObserver?: ResizeObserver;
    private renderCallback = () => this.refresh();

    constructor(wrapperElement: HTMLElement) {
        this.wrapperElement = wrapperElement;
        const contentClass = moraScrollBarConf.container.content.className;
        this.content = this.wrapperElement.getElementsByClassName(contentClass)[0] as HTMLElement;

        // Create msc-content
        if (!this.content) {
            const content = createElement({ tag: moraScrollBarConf.container.content.tag, classNames: [contentClass] });
            Array.from(this.wrapperElement.children).forEach(child => {
                content.appendChild(child);
            });
            this.wrapperElement.appendChild(content);
            this.content = content;
        }

        this._addScrollbar();
        this._setRefreshEvents();
    }

    private _addScrollbar() {
        this.scrollbar = new Scrollbar(this);
    }

    private _setRefreshEvents() {
        this.content.addEventListener("scroll", this.renderCallback);
        // TODO: Test support
        this.contentObserver = new ResizeObserver(() => {
            this.refresh();
        });
        this.contentObserver.observe(this.content);
    }


    
    public refresh() {
        this._hideNativeScrollbar(this.enabled);
        this.scrollbar?.setEnabled(this.enabled);
        this.scrollbar?.renderDisplayAndPosition();
    }

    private _hideNativeScrollbar(enabled: boolean) {
        let scrollbarWidth = (this.content.offsetWidth - this.content.clientWidth);
        this.content.style.marginRight = enabled ? `-${scrollbarWidth}px` : "";
        this.content.style.width = enabled ? `calc(100% + ${scrollbarWidth}px)` : "";
    }
    
    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    public getContent() {
        return this.content;
    }

    public getWrapper() {
        return this.wrapperElement;
    }

    public onDestroy() {
        // clear contentEvent
        this.contentObserver?.disconnect();
        this.content.removeEventListener("scroll", this.renderCallback);
        console.log("Removed content event listener!")
        // call scrollBarOnDestroy
        this.scrollbar?.onDestroy();
    }
}

export class ScrollbarManager {
    private wrapperElements: HTMLCollectionOf<HTMLElement>
    private wrappersMap: Map<HTMLElement, Wrapper> = new Map();

    constructor(autoDiscover: boolean = false) {
        const className = moraScrollBarConf.container.wrapper.className;
        this.wrapperElements = document.getElementsByClassName(className) as HTMLCollectionOf<HTMLElement>;

        // todo improve autoDiscover to avoid having to use onload

        if (autoDiscover) {
            const mutationObserver = new MutationObserver(mutations => {
                
                if(this.wrapperElements.length != this.wrappersMap.size){
                    this.refresh()
                }
            });

            mutationObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true, // Detect class attribute changes
                attributeFilter: ["class"], // Limit to class attribute
            });
        }

        // window.addEventListener("resize", (event: UIEvent)=> {
        //     this.refresh();
        // })
    }

    public refresh() {
        const enabled = this._hasNativeScrollbar();
        // todo hide and rerender when changing from touch to not 
        const actualWrappers: HTMLElement[] = [];
        for (let i = 0; i < this.wrapperElements.length; i++) {
            const wrapperElement = this.wrapperElements[i];
            actualWrappers.push(wrapperElement);
            if (!this.wrappersMap.has(wrapperElement)) {
                this.wrappersMap.set(wrapperElement, new Wrapper(wrapperElement));
            }
            const wrapper = this.wrappersMap.get(wrapperElement);
            wrapper?.setEnabled(enabled);
            wrapper?.refresh();
        }
        const managedWrapperElements = Array.from(this.wrappersMap.keys());
        managedWrapperElements.filter(wrapperElement => !actualWrappers.includes(wrapperElement))
            .forEach(orphanWrapperElement => {
                const orphanWrapper = this.wrappersMap.get(orphanWrapperElement);
                orphanWrapper?.onDestroy();
                this.wrappersMap.delete(orphanWrapperElement);
        })
    }

    private _hasNativeScrollbar() {
        const test = document.createElement("div");
        test.style.position = "fixed";
        test.style.overflowY = "scroll";
        test.style.height = "100%";
        test.style.width = "100%";
        test.style.boxSizing = "border-box";
        test.id = "msc-tester";
        document.body.appendChild(test);
        const has_scrollbar = ((test.offsetWidth - test.clientWidth) > 0);
        document.body.removeChild(test);
        return has_scrollbar;
    }
}

export const startManager = () => {
    // todo externalize
    const manager = new ScrollbarManager(true);
    manager.refresh();
    return manager;
}
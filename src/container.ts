'use strict'
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
    private listners: { event: string, callback: (event: Event) => void }[] = []

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
        this._setRerenderEvents();
        this._setTrackEvents();
        this._setHandleEvents();
        this._setButtonsEvents();
    }
    private _setRerenderEvents() {
        const renderCallback = () => this.renderDisplayAndPosition();
        this.targetContent.addEventListener("scroll", renderCallback);
        // TODO: Test support
        const resizeObserver = new ResizeObserver(() => {
            this.renderDisplayAndPosition();
        });
        resizeObserver.observe(this.targetContent);
    }

    private _setTrackEvents() {
        this.track.addEventListener("click", (event: Event) => {
            this._onTrackClick(event as PointerEvent);
        });
    }

    private _setHandleEvents() {
        const handleOnPointerDown = (event: Event) => {
            this._startMeasuringScroll(event);
        };
        this.handle?.addEventListener("pointerdown", handleOnPointerDown);
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
    private _submitListener(eventName: string, callback: (event: Event) => void) {
        this.listners.push({ event: eventName, callback })
        window.addEventListener(eventName, callback);
    }

    private _startMeasuringScroll(event: Event) {
        this._stopMeasuringScroll();
        this.targetWrapper.classList.add("msc-using-scroll");
        const stopScrollCallback = (event: Event) => {
            this._stopMeasuringScroll();
        }
        this._submitListener("pointercancel", stopScrollCallback);
        this._submitListener("pointerup", stopScrollCallback);


        const initials = {
            top: this.handle.offsetTop,
            cursor: (event as PointerEvent).clientY
        }
        const doScrollCallback = (event: Event) => {
            this._doScrollOnPointerMove(event as PointerEvent, initials);
        }
        this._submitListener("pointermove", doScrollCallback);

    }

    private _stopMeasuringScroll() {
        this.targetWrapper.classList.remove("msc-using-scroll");
        while (this.listners.length > 0) {
            const listener = this.listners.shift();
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
        this.scrollbarElement.style.display = this.targetContent.offsetHeight < this.targetContent.scrollHeight ?
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
}

class Wrapper {
    private wrapperElement: HTMLElement;
    private content?: HTMLElement;
    private scrollbar?: Scrollbar;
    constructor(wrapperElement: HTMLElement) {
        this.wrapperElement = wrapperElement;
        this.content = this.wrapperElement.getElementsByClassName("msc-content")[0] as HTMLElement;
        this._addScrollbar();
    }
    private _addScrollbar() {
        if (this.content) {
            this._hideNativeScrollbar()
            this.scrollbar = new Scrollbar(this);
            this.scrollbar.renderDisplayAndPosition();
        }
    }
    public refresh() {
        this.scrollbar?.renderDisplayAndPosition();
    }
    private _hideNativeScrollbar() {
        if (this.content) {
            // I don't remember why it was +1...
            let scrollbarWidth = (this.content.offsetWidth - this.content.clientWidth);
            this.content.style.marginRight = `-${scrollbarWidth}px`;
            this.content.style.width = `calc(100% + ${scrollbarWidth}px)`;
        }
    }
    public getContent() {
        return this.content;
    }
    public getWrapper() {
        return this.wrapperElement;
    }
}

export class Manager {
    private wrapperElements: HTMLCollectionOf<HTMLElement>
    private wrappersMap: Map<HTMLElement, Wrapper> = new Map();

    constructor(autoDiscover: boolean = false) {
        const className = moraScrollBarConf.container.wrapper.className;
        this.wrapperElements = document.getElementsByClassName(className) as HTMLCollectionOf<HTMLElement>;

        // todo improve autoDiscover to avoid having to use onload
        if (autoDiscover) {
            const mutationObserver = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    // Check for added nodes in the mutation
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && (node as HTMLElement).classList.contains(className)) {  // 1 is for element nodes
                            this.refresh()
                        }
                    });
                });
            });

            mutationObserver.observe(document.body, {
                childList: true, 
                subtree: true    
            });
        }
    }

    public refresh() {
        // todo hide and rerender when changing from touch to not touch
        if (this._hasNativeScrollbar()) {
            for (let i = 0; i < this.wrapperElements.length; i++) {
                const wrapperElement = this.wrapperElements[i];
                if (!this.wrappersMap.has(wrapperElement)) {
                    this.wrappersMap.set(wrapperElement, new Wrapper(wrapperElement));
                }
                const wrapper = this.wrappersMap.get(wrapperElement);
                wrapper?.refresh();
            }
        }
    }

    private _hasNativeScrollbar() {
        const test = document.createElement("div");
        test.style.position = "absolute";
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
'use strict'
import './index.scss'
import { moraScrollBarConf } from "./configuration";
import { createElement } from "./utils/element";
type Axis = "x" | "y"
const log = (message: string) => {
    if (moraScrollBarConf.debug) {
        console.log(message)
    }
}
const dictionary = {
    dimension: {
        y: "height" as "height",
        x: "width" as "width"
    },
    offsetDimension: {
        y: "offsetHeight" as "offsetHeight",
        x: "offsetWidth" as "offsetWidth"
    },
    scrollDimension: {
        y: "scrollHeight" as "scrollHeight",
        x: "scrollWidth" as "scrollWidth"
    },

    clientDimension: {
        y: "clientHeight" as "clientHeight",
        x: "clientWidth" as "clientWidth"
    },
    position: {
        y: "top" as "top",
        x: "left" as "left"
    },
    offsetPostion: {
        y: "offsetTop" as "offsetTop",
        x: "offsetLeft" as "offsetLeft"
    },
    scrollPosition: {
        y: "scrollTop" as "scrollTop",
        x: "scrollLeft" as "scrollLeft"
    },
    clientAxis: {
        y: "clientY" as "clientY",
        x: "clientX" as "clientX"
    },
    negButton: {
        y: "buttonUp" as "buttonUp",
        x: "buttonLeft" as "buttonLeft"
    },
    posButton: {
        y: "buttonDown" as "buttonDown",
        x: "buttonRight" as "buttonRight"
    },
    posMargin: {
        y: "marginBottom" as "marginBottom",
        x: "marginRight" as "marginRight"
    }
}

const getScrollbarDimension = (element: HTMLElement, axis: Axis) => {
    return (element[dictionary.offsetDimension[axis]] - element[dictionary.clientDimension[axis]])
}
interface ControlledElements {
    wrapper: HTMLElement,
    visibleContent: HTMLElement,
    wholeContent: HTMLElement
}

class Scrollbar {
    private target: ControlledElements;
    private scrollbarElement: HTMLElement;
    private track: HTMLElement;
    private handle: HTMLElement;
    private buttonNeg: HTMLElement;
    private buttonPos: HTMLElement;
    private onInitListeners: { target: Window | HTMLElement, event: string, callback: (event: Event) => void }[] = []
    private onScrollListeners: { event: string, callback: (event: Event) => void }[] = []
    private enabled: boolean = true;
    private axis: Axis;

    constructor(target: ControlledElements, axis: Axis = "y") {
        this.axis = axis;
        this.target = target;
        const scrollbarConf = { ...moraScrollBarConf.scrollbar };
        scrollbarConf.classNames = [...scrollbarConf.classNames, ...scrollbarConf.axisClassNames[axis]];
        this.scrollbarElement = createElement(scrollbarConf);
        // Fix selection bug 
        this.scrollbarElement.style.userSelect = this.scrollbarElement.style.webkitUserSelect = (this.scrollbarElement.style as any).msUserSelect = "none";

        this.handle = createElement(moraScrollBarConf.scrollbar.handle);
        this.track = createElement(moraScrollBarConf.scrollbar.track);
        this.track.appendChild(this.handle);
        // Create buttons 
        this.buttonNeg = createElement(moraScrollBarConf.scrollbar[dictionary.negButton[this.axis]]);
        this.buttonPos = createElement(moraScrollBarConf.scrollbar[dictionary.posButton[this.axis]]);
        this.scrollbarElement.append(this.track, this.buttonNeg, this.buttonPos);
        this.target.wrapper.appendChild(this.scrollbarElement);
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
                    this._buttonScroll(this.target.visibleContent, increase);
                }, 1);
            }
            element.onpointerup = element.onpointerout = () => {
                clearInterval(interval);
            }
        }
        setupButton(this.buttonNeg, -1);
        setupButton(this.buttonPos, 1);
    }

    private _buttonScroll(targetElement: HTMLElement, value: number) {
        const scrollPosKey = dictionary.scrollPosition[this.axis];
        targetElement[scrollPosKey] = targetElement[scrollPosKey] + value;
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
        this.target.wrapper.classList.add("msc-using-scroll");
        const stopScrollCallback = (event: Event) => {
            this._stopMeasuringScroll();
        }
        this._submitOnScrollListener("pointercancel", stopScrollCallback);
        this._submitOnScrollListener("pointerup", stopScrollCallback);


        const initials = {
            position: this.handle[dictionary.offsetPostion[this.axis]],
            cursor: (event as PointerEvent)[dictionary.clientAxis[this.axis]]
        }
        const doScrollCallback = (event: Event) => {
            this._doScrollOnPointerMove(event as PointerEvent, initials);
        }
        this._submitOnScrollListener("pointermove", doScrollCallback);

    }

    private _stopMeasuringScroll() {
        this.target.wrapper.classList.remove("msc-using-scroll");
        while (this.onScrollListeners.length > 0) {
            const listener = this.onScrollListeners.shift();
            if (listener) {
                window.removeEventListener(listener.event, listener.callback);
            }
        }
    }

    private _doScrollOnPointerMove(event: PointerEvent, initials: { position: number, cursor: number }) {
        const offsetDimensionKey = dictionary.offsetDimension[this.axis];
        const positionKey = dictionary.scrollPosition[this.axis];
        const scrollDimensionKey = dictionary.scrollDimension[this.axis];
        const target = this.target.visibleContent;
        const handle = this.handle;
        const track = this.track;
        const pointerAxisPosition = event[dictionary.clientAxis[this.axis]];
        const percent = (initials.position / (track[offsetDimensionKey] - handle[offsetDimensionKey])) +
            ((pointerAxisPosition - initials.cursor) / (track[offsetDimensionKey] - handle[offsetDimensionKey]));

        target[positionKey] = percent * (target[scrollDimensionKey] - target[offsetDimensionKey]);
    }

    private _jumpPageBy(direction: number) {
        const element = this.target.visibleContent;
        const initialPosition = element[dictionary.scrollPosition[this.axis]];
        const finalPosition = initialPosition + (element[dictionary.offsetDimension[this.axis]] * direction);
        if (typeof Element.prototype.scrollTo === 'function') {
            element.scrollTo({
                [dictionary.position[this.axis]]: finalPosition,
                behavior: 'smooth'
            });
        }
    }
    private _onTrackClick(event: PointerEvent) {
        if (event.target === this.track) {
            const clientAxisPosition = event[dictionary.clientAxis[this.axis]];
            if (clientAxisPosition <= this.handle.getBoundingClientRect()[dictionary.position[this.axis]] + this.handle[dictionary.offsetDimension[this.axis]]) {
                this._jumpPageBy(-1)
            } else {
                this._jumpPageBy(1);
            }
        }
    }
    public renderDisplayAndPosition() {
        const axis = this.axis;
        const contentOffsetDim = this.target.visibleContent[dictionary.offsetDimension[axis]];
        const trackOffsetDim = this.track[dictionary.offsetDimension[axis]];
        const contentScrollDim = this.target.visibleContent[dictionary.scrollDimension[axis]];
        const contentScrollPos = this.target.visibleContent[dictionary.scrollPosition[axis]];


        // set mora scrollbar display
        this.scrollbarElement.style.display = this.enabled && contentOffsetDim < contentScrollDim ?
            "block" : "none";

        // set handle height
        this.handle.style[dictionary.dimension[axis]] = `${trackOffsetDim * (contentOffsetDim / contentScrollDim)}px`;

        // set handle top postion
        const scrollbarDim = getScrollbarDimension(this.target.visibleContent, axis);
        const invisibleContentDim = (contentScrollDim - contentOffsetDim) + scrollbarDim;

        const handleTrackRoom = this.track[dictionary.clientDimension[axis]] - this.handle[dictionary.offsetDimension[axis]];

        this.handle.style[dictionary.position[axis]] = `${contentScrollPos * handleTrackRoom / invisibleContentDim}px`;


        // set button classes
        if (contentScrollPos == 0) {
            this.buttonNeg.classList.add("disabled");
        } else {
            this.buttonNeg.classList.remove("disabled");
        }
        if (contentScrollPos == contentScrollDim - contentOffsetDim) {
            this.buttonPos.classList.add("disabled");
        } else {
            this.buttonPos.classList.remove("disabled");
        }
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }
    public onDestroy() {
        this.onInitListeners.forEach(listener => {
            listener.target.removeEventListener(listener.event, listener.callback);
        });
        this.target.wrapper.removeChild(this.scrollbarElement);
    }
}

class Wrapper {
    private wrapperElement: HTMLElement;
    private visibleContent: HTMLElement;
    private wholeContent: HTMLElement;
    private scrollbarY?: Scrollbar;
    private scrollbarX?: Scrollbar;
    private enabled: boolean = true;
    private contentSizeObserver?: ResizeObserver;
    private renderCallback = () => this.refresh();

    constructor(wrapperElement: HTMLElement) {
        this.wrapperElement = wrapperElement;
        const visibleContentClass = moraScrollBarConf.container.visibleContent.className;
        const wholeContentClass = moraScrollBarConf.container.wholeContent.className;
        this.visibleContent = this._wrapParentChildrenIfDoesntExist(this.wrapperElement, visibleContentClass, moraScrollBarConf.container.visibleContent.tag)
        this.wholeContent = this._wrapParentChildrenIfDoesntExist(this.visibleContent, wholeContentClass, moraScrollBarConf.container.wholeContent.tag)

        this._addScrollbar();
        this._setRefreshEvents();
    }

    private _wrapParentChildrenIfDoesntExist(parent: HTMLElement, className: string, tag: string) {
        let element = parent.getElementsByClassName(className)[0] as HTMLElement;
        // Create msc-visible-content
        if (!element) {
            element = createElement({ tag, classNames: [className] });
            Array.from(parent.childNodes).forEach(child => {
                element.appendChild(child);
            });
            parent.appendChild(element);
        }
        return element;
    }
    
    private _addScrollbar() {
        const controlled: ControlledElements = {
            wrapper: this.wrapperElement,
            visibleContent: this.visibleContent,
            wholeContent: this.wholeContent
        }
        this.scrollbarY = new Scrollbar(controlled, "y");
        this.scrollbarX = new Scrollbar(controlled, "x");
    }

    private _setRefreshEvents() {
        this.visibleContent.addEventListener("scroll", this.renderCallback);
        // TODO: Test change to wholeContent Observer
        this.contentSizeObserver = new ResizeObserver(() => {
            this.refresh();
        });
        this.contentSizeObserver.observe(this.visibleContent);
        this.contentSizeObserver.observe(this.wholeContent);
    }



    public refresh() {
        this._hideNativeScrollbar(this.enabled, "y");
        this._hideNativeScrollbar(this.enabled, "x");
        this.scrollbarY?.setEnabled(this.enabled);
        this.scrollbarY?.renderDisplayAndPosition();

        this.scrollbarX?.setEnabled(this.enabled);
        this.scrollbarX?.renderDisplayAndPosition();
    }

    private _hideNativeScrollbar(enabled: boolean, axis: Axis = "y") {
        const Laxis = axis === "y" ? "x" : "y";
        let scrollbarDim = getScrollbarDimension(this.visibleContent, Laxis);
        this.visibleContent.style[dictionary.posMargin[Laxis]] = enabled ? `-${scrollbarDim}px` : "";
        this.visibleContent.style[dictionary.dimension[Laxis]] = enabled ? `calc(100% + ${scrollbarDim}px)` : "";
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    public getVisibleContent() {
        return this.visibleContent;
    }

    public getWrapper() {
        return this.wrapperElement;
    }

    public onDestroy() {
        // clear contentEvent
        this.contentSizeObserver?.disconnect();
        this.visibleContent.removeEventListener("scroll", this.renderCallback);
        log("Removed content event listener!")
        // call scrollBarOnDestroy
        this.scrollbarY?.onDestroy();
        this.scrollbarX?.onDestroy();
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
                const actualElements = Array.from(this.wrapperElements) as Node[];
                const managedElements = Array.from(this.wrappersMap.keys()) as Node[];

                const hadChange = mutations.some(
                    mutation => {
                        return actualElements.includes(mutation.target) !==
                            managedElements.includes(mutation.target)
                    }
                )
                if (hadChange) {
                    log("Refresh on autoDiscover");
                    this.refresh();
                }
            });

            mutationObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ["class"]
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
    log("Started Mora Scrollbar");
    return manager;
}
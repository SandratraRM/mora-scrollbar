export const moraScrollBarConf = {
    debug: process.env.DEBUG,
    container: {
        wrapper: {
            className: "msc-wrapper"
        },
        visibleContent: {
            tag: "div",
            className: "msc-visible-content"
        },
        wholeContent: {
            tag: "div",
            className: "msc-whole-content"
        }
    },
    scrollbar: {
        tag: "div",
        classNames: ["msc-scrollbar"],
        axisClassNames:{
            y: ["msc-y"],
            x: ["msc-x"]
        },
        track: {
            tag: "div",
            classNames: ["msc-track"]
        },
        handle: {
            tag: "button",
            classNames: ["msc-handle"]
        },
        buttonUp: {
            tag: "button",
            classNames: ["msc-btn-up"]
        },
        buttonDown: {
            tag: "button",
            classNames: ["msc-btn-down"]
        },
        buttonLeft: {
            tag: "button",
            classNames: ["msc-btn-left"]
        },
        buttonRight: {
            tag: "button",
            classNames: ["msc-btn-right"]
        },
    }
}

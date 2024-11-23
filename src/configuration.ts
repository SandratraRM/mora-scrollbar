export const moraScrollBarConf = {
    debug: process.env.DEBUG,
    container: {
        wrapper: {
            className: "msc-wrapper"
        },
        content: {
            tag: "div",
            className: "msc-content"
        },
    },
    scrollbar: {
        tag: "div",
        classNames: ["msc-scrollbar"],
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

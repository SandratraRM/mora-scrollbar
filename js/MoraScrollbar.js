"use strict";
var Mora_ScrollBar = /** @class */ (function () {
    function Mora_ScrollBar() {
        var _this = this;
        this.initial_cursor = 0;
        this.initial_top = 0;
        this.current_element = null;
        this.wrappers = document.getElementsByClassName("msc-wrapper");
        this.scrollers = document.getElementsByClassName("msc-handle");
        this.default_pointerup = window.onpointerup;
        this.default_pointermove = window.onpointermove;
        this.default_pointercancel = window.onpointercancel;
        window.addEventListener("resize", function (event) { _this.refresh(); });
    }
    /**
     * createElement
content,id?     */
    Mora_ScrollBar.prototype.createElement = function () {
        var wrapper = document.createElement("DIV"), content = document.createElement("DIV");
        wrapper.classList.add("msc-wrapper");
        content.classList.add("msc-content");
        wrapper.appendChild(content);
        return wrapper;
    };
    Mora_ScrollBar.prototype._render = function () {
        for (var s = 0; s < this.scrollers.length; s++) {
            var handle = this.scrollers[s];
            var content = handle.parentElement.parentElement.previousElementSibling;
            var wrapper = content.parentElement;
            var arrow_down = wrapper.lastChild.lastChild;
            var arrow_up = wrapper.lastChild.firstChild;
            var scroll_width = (content.offsetWidth - content.clientWidth);
            if (scroll_width > 0) {
                if (content.offsetHeight == content.scrollHeight) {
                    handle.parentElement.parentElement.style.display = "none";
                }
                else if (content.offsetHeight < content.scrollHeight) {
                    handle.parentElement.parentElement.style.display = "block";
                }
                var initial_height = handle.parentElement.offsetHeight * this._calculateHeight({ element: content }) / 100;
                handle.style.height = initial_height + "px";
                var top_1 = ((content.scrollTop / (content.scrollHeight - content.offsetHeight)) * (handle.parentElement.clientHeight - handle.offsetHeight));
                handle.style.top = top_1 + "px";
                if (content.scrollTop == 0) {
                    arrow_up.classList.add("disabled");
                }
                else {
                    arrow_up.classList.remove("disabled");
                }
                if (content.scrollTop == content.scrollHeight - content.offsetHeight) {
                    arrow_down.classList.add("disabled");
                }
                else {
                    arrow_down.classList.remove("disabled");
                }
            }
            else {
                handle.parentElement.parentElement.style.display = "none";
            }
        }
    };
    Mora_ScrollBar.prototype._calculateHeight = function (parameters) {
        var element = parameters.element;
        return (element.offsetHeight / element.scrollHeight) * 100;
    };
    Mora_ScrollBar.prototype.refresh = function () {
        this.remove_scrollbars();
        if (this._hasScrollbars()) {
            this._addScrollbar();
        }
    };
    Mora_ScrollBar.prototype._hasScrollbars = function () {
        var test = document.createElement("div");
        test.style.position = "absolute";
        test.style.overflowY = "scroll";
        test.style.height = "100%";
        test.style.width = "100%";
        test.style.boxSizing = "border-box";
        test.id = "msc-tester";
        document.body.appendChild(test);
        var has_scrollbar = ((test.offsetWidth - test.clientWidth) > 0);
        document.body.removeChild(test);
        return has_scrollbar;
    };
    Mora_ScrollBar.prototype._addScrollbar = function () {
        var _this = this;
        var _Mora_ScrollBar = this;
        var _loop_1 = function (i) {
            var wrapper = this_1.wrappers[i];
            var content = wrapper.getElementsByClassName("msc-content")[0];
            if (content.nextElementSibling == null) {
                //@ts-ignore
                content.addEventListener("scroll", function () { _this._render(); });
                content.addEventListener("resize", function () { _this._render(); });
                var track_1 = document.createElement("DIV");
                track_1.classList.add("msc-track");
                var handle_1 = document.createElement("BUTTON");
                handle_1.classList.add("msc-handle");
                handle_1.addEventListener("pointerdown", function (event) {
                    _Mora_ScrollBar.startScroll(event, handle_1);
                });
                track_1.addEventListener("click", function (event) {
                    _Mora_ScrollBar.jumpTo(event, track_1);
                });
                track_1.appendChild(handle_1);
                var scrollbar = document.createElement("DIV");
                scrollbar.classList.add("msc-scrollbar");
                var arrow_up = document.createElement("BUTTON");
                var arrow_down = document.createElement("BUTTON");
                arrow_up.classList.add("msc-btn-up");
                arrow_down.classList.add("msc-btn-down");
                var upInt_1;
                arrow_up.onpointerdown = function () {
                    upInt_1 = setInterval(function () {
                        _this._arrow_scroll(content, -1);
                    }, 1);
                };
                arrow_up.onpointerup = arrow_up.onpointerout = function () {
                    clearInterval(upInt_1);
                };
                var downInt_1;
                arrow_down.onpointerdown = function () {
                    downInt_1 = setInterval(function () {
                        _this._arrow_scroll(content, 1);
                    }, 1);
                };
                arrow_down.onpointerup = arrow_down.onpointerout = function () {
                    clearInterval(downInt_1);
                };
                scrollbar.appendChild(arrow_up);
                scrollbar.appendChild(track_1);
                scrollbar.appendChild(arrow_down);
                wrapper.appendChild(scrollbar);
            }
        };
        var this_1 = this;
        for (var i = 0; i < this.wrappers.length; i++) {
            _loop_1(i);
        }
        ;
        this._render();
    };
    Mora_ScrollBar.prototype.startScroll = function (event, element) {
        document.body.parentElement.style.touchAction = "none";
        this.stopScroll();
        var _Mora_ScrollBar = this;
        _Mora_ScrollBar.initial_cursor =  event.clientY;
        _Mora_ScrollBar.current_element = element;
        _Mora_ScrollBar.initial_top = element.offsetTop;
        element.parentElement.parentElement.parentElement.classList.add("using-scroll");
        document.body.style.userSelect = document.body.style.webkitUserSelect = document.body.style.msUserSelect = "none";
        this.default_pointermove = window.onpointermove;
        window.onpointermove = function (event) {
            _Mora_ScrollBar.pointerScroll(event);
            if (_Mora_ScrollBar.default_pointermove != null) {
                (_Mora_ScrollBar.default_pointermove.bind(this))(event);
            }
        };
        this.default_pointerup = window.onpointerup;
        window.onpointerup = function (event) {
            _Mora_ScrollBar.stopScroll();
            if (_Mora_ScrollBar.default_pointerup != null) {
                (_Mora_ScrollBar.default_pointerup.bind(this))(event);
            }
        };
        this.default_pointercancel = window.onpointercancel;
        window.onpointercancel = function (event) {
            _Mora_ScrollBar.stopScroll();
            if (_Mora_ScrollBar.default_pointercancel != null) {
                (_Mora_ScrollBar.default_pointercancel.bind(this))(event);
            }
        };
    };
    Mora_ScrollBar.prototype.stopScroll = function () {
        var _Mora_ScrollBar = this;
        var using = document.getElementsByClassName("using-scroll")[0];
        if (using != null) {
            using.classList.remove("using-scroll");
        }
        document.body.parentElement.style.touchAction = "";
        document.body.style.userSelect = document.body.style.webkitUserSelect = document.body.style.msUserSelect = "";
        window.onpointermove = _Mora_ScrollBar.default_pointermove;
        window.onpointerup = _Mora_ScrollBar.default_pointerup;
        window.onpointercancel = _Mora_ScrollBar.default_pointercancel;
    };
    Mora_ScrollBar.prototype.remove_scrollbars = function () {
        for (var index = 0; index < this.wrappers.length; index++) {
            //@ts-ignore
            var content = this.wrappers[index].getElementsByClassName("msc-content")[0];
            //@ts-ignore
            var scroll_width = (content.offsetWidth - content.clientWidth) + 1;
            //@ts-ignore
            content.style.marginRight = "-" + scroll_width + "px";
            //@ts-ignore
            content.style.width = "calc(100% + " + scroll_width + "px)";
        }
    };
    Mora_ScrollBar.prototype.pointerScroll = function (event) {
        var _Mora_ScrollBar = this;
        var pointer_Y = event.clientY;
        var element = this.current_element;
        var percent = (this.initial_top / (element.parentElement.offsetHeight - element.offsetHeight)) + ((pointer_Y - _Mora_ScrollBar.initial_cursor) / (element.parentElement.offsetHeight - element.offsetHeight));
        var cible = element.parentElement.parentElement.previousElementSibling;
        cible.scrollTop = percent * (cible.scrollHeight - cible.offsetHeight);
    };
    Mora_ScrollBar.prototype.jumpTo = function (event, element) {
        if (event.target == element) {
            var Y = event.clientY;
            var cible = element.parentElement.parentElement.getElementsByClassName("msc-content")[0];
            var handle = element.lastChild;
            var by = void 0;
            if (Y <= handle.getBoundingClientRect().top + handle.offsetHeight) {
                // by =  ((Y - element.getBoundingClientRect().top)/ (element.offsetHeight - handle.offsetHeight));
                this.nextPage(cible, -1);
            }
            else {
                // const scroller_position = handle.getBoundingClientRect().top - element.getBoundingClientRect().top;
                // const diff = (Y - element.getBoundingClientRect().top) - (scroller_position + handle.offsetHeight); 
                // by = (scroller_position + diff) / (element.offsetHeight - handle.offsetHeight);
                this.nextPage(cible, 1);
            }
            // cible.scrollTop = by * (cible.scrollHeight - cible.offsetHeight);
        }
    };
    Mora_ScrollBar.prototype.nextPage = function (element, direction) {
        var initial_top = element.scrollTop;
        var final_top = initial_top + (element.offsetHeight * direction);
        var interval = setInterval(function () {
            element.scrollTop += (element.offsetHeight * direction) / 10;
            if (direction > 0 && element.scrollTop >= final_top || direction < 0 && element.scrollTop <= final_top || element.scrollTop == 0 || element.scrollTop == element.scrollHeight - element.offsetHeight) {
                clearInterval(interval);
                element.scrollTop = final_top;
            }
        }, 30);
    };
    Mora_ScrollBar.prototype._arrow_scroll = function (cible, value) {
        cible.scrollTop = cible.scrollTop + value;
    };
    return Mora_ScrollBar;
}());
var MoraScrollbar;
window.addEventListener("load", function () {
    MoraScrollbar = new Mora_ScrollBar();
    MoraScrollbar.refresh();
});

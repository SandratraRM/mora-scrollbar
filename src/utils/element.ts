interface CreateElementArgs {
    tag: string,
    classNames?: string[]
}
export const createElement = ({
    tag, classNames
}: CreateElementArgs) => {
    const element = document.createElement(tag)
    if(Array.isArray(classNames) && classNames.length > 0){
        classNames.forEach(className => element.classList.add(className))
    }
    return element;
}

export const addClass = (element: Element, className: string) => {
    element.classList.add(className);
}


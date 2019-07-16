# Mora Scrollbars

[![HitCount](http://hits.dwyl.io/sandratrarm/mora-scrollbar.svg)](http://hits.dwyl.io/sandratrarm/mora-scrollbar)

 >A zero dependency Javascript scrollbar.

 *See also the `demo/index.html` file in your browser*

## Author

### RAMBELOSON Mendrika Sandratra

- [Facebook](https://www.facebook.com/sandratra.rambeloson)
- [Github](https://www.github.com/SandratraRM)
- [Website](https://mendrikars.ml)

## Features

- Easy to use
- Very smooth
- Fully customizable scrollbars
- Support touchscreen desktop
- Disabled on devices with no scrollbars
- Ability to add arrow buttons
- Runs without JQuery
- Works on all major browsers
  
## How to use

### Installing

First of all you need to add the `./js/MoraScrollbar.js` and the `./css/MoraScrollbar.css` files in your html head.

```HTML
<head>
    <!-- Other head's stuffs -->
    <link rel="stylesheet" href="/path/to/MoraScrollbar.css">
    <script src="/path/to/MoraScrollbar.js"></script>
    <!-- Put your main stylesheet after the scrollbar.css if you want to apply custom styles-->
</head>
```

> You can of course merge the content of the scrollbar.css with your main stylesheet and edit directly the default styles.

### Using

Now, to actually use your custom scrollbars, you need two elements. Usually two `<div>`. 
Then give them respectively the class `msc-wrapper` and `msc-content`.

```HTML
<div class="msc-wrapper">
    <div class="msc-content">
        Your overflowing content
    </div>
</div>
```

> Add `with-arrows` to the wrapper element to display the arrows.

### Styling

Default styles are already set in the `./css/MoraScrollbar.css` stylesheet, but you can change them as you need.

>Just look at `demo/index.html#custom` to see how to customize your scrollbars.

### Refreshing

The plugin works fine until:

- New elements with custom scrollbars are added dynamically with Javascript

- The content of the `msc-content` has changed

To fix this, when you reach one of these situation, just call the `MoraScrollbar.refresh()` method.

## Future features

- Support for horizontal scrollbars
- Theme packs

## See also

- [PHP Mora framework](https://www.github.com/SandratraRM/mora-mora) : A PHP Framework made by myself.

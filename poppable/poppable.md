# 可弹出的
通过用户操作显示弹层的交互效果。

## 基本用法
设置元素 `elem` 在用户点击 `target` 后自动弹出：
```html demo {6-8} doc
<button id="target">点我</button>
<div id="elem" class="doc-box" style="position: fixed; display: none;"></div>
<script>
    import { Poppable } from "./poppable"

    const popper = new Poppable(elem, target)
</script>
```

## 显示事件
使用 [`event`](#api/poppable/event) 字段指定触发弹层显示的事件。

### 点击类
- `click`(默认): 点击 `target` 后弹出，点击屏幕空白处消失。
- `dblclick`: 双击 `target` 后弹出，点击屏幕空白处消失。
- `auxclick`: 右击 `target` 后弹出，点击屏幕空白处消失。
- `contextmenu`: 作为 `target` 右键菜单后弹出，点击屏幕空白处消失。
- `pointerdown`: 指针在 `target` 按下后弹出，点击屏幕空白处消失。
- `pointerup`: 指针在 `target` 松开后弹出，点击屏幕空白处消失。

:::

```html demo doc
<button id="target_click">单击</button>
<div id="elem_click" class="doc-box" style="position: fixed; display: none;"></div>
<script>
    import { Poppable } from "./poppable"

    const popper = new Poppable(elem_click, target_click, {
        trigger: "click"
    })
</script>
```

---

```html demo doc
<button id="target_dblclick">双击</button>
<div id="elem_dblclick" class="doc-box" style="position: fixed; display: none;"></div>
<script>
    import { Poppable } from "./poppable"

    const popu =new Poppable(elem_dblclick, target_dblclick, {
        trigger: "dblclick"
    })
</script>
```

---

```html demo doc
<button id="target_auxclick">右击</button>
<div id="elem_auxclick" class="doc-box" style="position: fixed; display: none;"></div>
<script>
    import { Poppable } from "./poppable"

    const popper = new Poppable(elem_auxclick, target_auxclick, {
        trigger: "auxclick"
    })
</script>
```

:::

:::

```html demo doc
<button id="target_contextmenu">右键菜单</button>
<div id="elem_contextmenu" class="doc-box" style="position: fixed; display: none;"></div>
<script>
    import { Poppable } from "./poppable"
    
    const popper = new Poppable(elem_contextmenu, target_contextmenu, {
        trigger: "contextmenu"
    })
</script>
```

---

```html demo doc
<button id="target_pointerdown">指针按下</button>
<div id="elem_pointerdown" class="doc-box" style="position: fixed; display: none;"></div>
<script>
    import { Poppable } from "./poppable"

    const popper = new Poppable(elem_pointerdown, target_pointerdown, {
        trigger: "pointerdown"
    })
</script>
```

---

```html demo doc
<button id="target_pointerup">指针松开</button>
<div id="elem_pointerup" class="doc-box" style="position: fixed; display: none;"></div>
<script>
    import { Poppable } from "./poppable"

     const popper = new Poppable(elem_pointerup, target_pointerup, {
        trigger: "pointerup"
    })
</script>
```

:::

### 移动类
- `pointerenter`: 指针移入 `target`  后自动弹出，移到屏幕空白处消失。
- `hover`: 指针移入 `target` 后自动弹出，移出 `target` 后消失。
- `pointermove`: 指针移入 `target`  后自动弹出，并跟随鼠标移动。

:::

```html demo doc
<button id="target_pointerenter">鼠标进入</button>
<div id="elem_pointerenter" class="doc-box" style="position: fixed; display: none;"></div>
<script>
    import { Poppable } from "./poppable"

    const popper = new Poppable(elem_pointerenter, target_pointerenter, {
        trigger: "pointerenter"
    })
</script>
```

---

```html demo doc
<button id="target_hover">鼠标悬停</button>
<div id="elem_hover" class="doc-box" style="position: fixed; display: none;"></div>
<script>
    import { Poppable } from "./poppable"

    const popper = new Poppable(elem_hover, target_hover, {
        trigger: "hover"
    })
</script>
```

---

```html demo doc
<button id="target_pointermove">跟随鼠标移动</button>
<div id="elem_pointermove" class="doc-box" style="position: fixed; display: none;"></div>
<script>
    import { Poppable } from "./poppable"

    const popper = new Poppable(elem_pointermove, target_pointermove, {
        trigger: "pointermove"
    })
</script>
```

:::

### 焦点类
- `active`：指针在 `target` 按下时显示，松开后消失。
- `focus`： `target` 获取焦点后显示，失去焦点后消失。
- `focusin`：`target` 获取焦点后显示，点击屏幕空白处消失。

:::

```html demo doc
<button id="target_active">指针按下时</button>
<div id="elem_active" class="doc-box" style="position: fixed; display: none;"></div>
<script>
    import { Poppable } from "./poppable"

    const popper = new Poppable(elem_active, target_active, {
        trigger: "active"
    })
</script>
```

---

```html demo doc
<button id="target_focus">拥有焦点时</button>
<div id="elem_focus" class="doc-box" style="position: fixed; display: none;"></div>
<script>
    import { Poppable } from "./poppable"

    const popper = new Poppable(elem_focus, target_focus, {
        trigger: "focus"
    })
</script>
```

---

```html demo doc
<button id="target_focusin">获取焦点</button>
<div id="elem_focusin" class="doc-box" style="position: fixed; display: none;"></div>
<script>
    import { Poppable } from "./poppable"

    const popper = new Poppable(elem_focusin, target_focusin, {
        trigger: "focusin"
    })
</script>
```

:::

### 自定义事件
手动调用 [`poppable.show()`](#api/poppable/show) 和 [`poppable.hide()`](#api/poppable/hide) 显示和隐藏弹层。

```html demo {8,11-14} doc
<button id="target_custom">点击后两秒</button>
<div id="elem_custom" class="doc-box" style="position: fixed; display: none;"></div>
<script>
    import { Poppable } from "./poppable"

    const popper = new Poppable(elem_custom, target_custom, {
        trigger: null
    })

    // 自定义绑定双击事件。
    target_custom.onclick = () => {
        setTimeout(() => {
            popper.show()
        }, 2000)
    }
</script>
```

## 显示动画
通过 [`animation`](#api/poppable/animation) 设置弹层的动画。可用的内置动画见[[../../web/dom#内置特效]]。
```html demo {8} doc
<button id="target_animation">按钮</button>
<div id="elem_animation" class="doc-box" style="position: fixed; display: none;"></div>
<script>
    import { Poppable } from "./poppable"

    new Poppable(elem_animation, target_animation, {
        animation: "scaleY",
        hideAnimation: "scaleX"
    })
</script>
```

## 动画原点
通过 [`animation`](#api/poppable/animation) 设置弹层的动画。可用的内置动画见[[../../web/dom#内置特效]]。
```html demo {8} doc
<button id="target_origin">按钮</button>
<div id="elem_origin" class="doc-box" style="position: fixed; display: none;"></div>
<script>
    import { Poppable } from "./poppable"

    new Poppable(elem_origin, target_origin, {
        animation: "scaleIn",
    })
</script>
```
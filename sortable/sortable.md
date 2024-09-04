# 可排序的

```html demo doc
<style>
	.list-group-item {
		background: #f2f3f4;
		margin: 8px 0;
	}

	#example1 {
		padding-bottom: 40px;
	}
</style>
<div id="example1" class="list-group col">
	<div class="list-group-item" id="example1-1"><span>Item 1</span>rrrr</div>
	<div class="list-group-item" id="example1-2">Item 2</div>
	<div class="list-group-item" id="example1-3">Item 3</div>
	<div class="list-group-item" id="example1-4" style="height:50px">Item 4</div>
	<div class="list-group-item" id="example1-5">Item 5</div>
	<div class="list-group-item" id="example1-6">Item 6</div>
</div>
<div id="example2" class="list-group col" style="display:flex; gap: 7px">
	<div class="list-group-item" id="example2-1"><span>Item 1s</span>rrrrs</div>
	<div class="list-group-item" id="example2-2">Item 2s</div>
	<div class="list-group-item" id="example2-3">Item 3s</div>
	<div class="list-group-item" id="example2-4">Item 4s</div>
	<div class="list-group-item" id="example2-5">Item 5s</div>
	<div class="list-group-item" id="example2-6">Item 6s</div>
</div>
<div id="example3" class="list-group col" style="display: grid; gap: 7px; grid-template-columns: repeat(3, auto)">
	<div class="list-group-item" id="example3-1"><span>Item 1s</span>rrrrs</div>
	<div class="list-group-item" id="example3-2">Item 2s</div>
	<div class="list-group-item" id="example3-3">Item 3s</div>
	<div class="list-group-item" id="example3-4">Item 4s</div>
	<div class="list-group-item" id="example3-5">Item 5s</div>
	<div class="list-group-item" id="example3-6">Item 6s</div>
</div>
<script>
    import { Sortable } from "./sortable"

    export const sortable1 = new Sortable(example1)
	
    export const sortable2 = new Sortable(example2)
	
    export const sortable3 = new Sortable(example3)

	sortable1.sources = sortable2.sources = sortable3.sources =  [sortable1, sortable2, sortable3]
</script>
```
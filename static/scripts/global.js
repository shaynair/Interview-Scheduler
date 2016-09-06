var socket;

function reload(d) {
	data = d;
	
	$(".chip").remove();
	
	$(".bottom-sheet").each(function() {
		let type = $(this).attr("id").substr(6);
		
		for (let d in data[type]) {
			if (data[type].hasOwnProperty(d)) {
				setChip(type, d, data[type][d]);
			}
		}
	});
		
}

function deselectChips() {
	$(".selected").each(function() {
		deselectChip($(this));
	});
}

function startProgress(e, data) {
	$(".preloader-wrapper").addClass("active");
	
	socket.emit(e, data);
}

function deselectChip($chip) {
	if ($chip.children(".chip-input").length > 0) {
		let t = $chip.children(".chip-input").val();
		let add = {id: $chip.attr("id").split("-")[1], type: $chip.attr("id").split("-")[0], text: t};
			
		if (editChip(add)) {
			startProgress("edit", add);
		}
	}
}

function selectChip($chip) {
	if ($chip.hasClass("selected")) {
		deselectChip($chip);
		return;
	}
	deselectChips();
	
	$chip.addClass("selected");
	let t = $chip.children(".chip-text").text();
		
	$chip.children(".chip-text").remove();
		
	let $in = $("<input>").addClass("input").addClass("chip-input").val(t);
		
	$in.prependTo($chip);
	
	$in.on('keypress', (e) => {
		if (e.which == 13) { // Enter
			$in.blur();
			return false;
		}
	});
	
	$in.on('blur', () => deselectChip($chip));
}

function setChip(type, d, text) {
	let $container = $("#modal-" + type).children(".modal-content").children(".chips");
	
	let $ch = $("<div>").addClass("chip").attr("id", type + "-" + d);
	$ch.append($("<span>").addClass("chip-text").text(text));
	
	let $close = $("<i>").addClass("close").addClass("material-icons").text("close");
	let $edit = $("<i>").addClass("edit").addClass("material-icons").text("mode_edit");
	
	$ch.append($close);
	$ch.append($edit);
	
	$close.on("click", function(e) {
		let add = {id: d, "type": type};
		startProgress("remove", add);
		
		removeChip(add);
	});
	$edit.on("click", () => selectChip($ch));

	
	$container.children(".new-chip").before($ch);
}

function addChip(add) {
	data[add.type][add.id] = add.text;
		
	setChip(add.type, add.id, add.text);
	//TODO edit table
}

function removeChip(add) {
	$("#" + add.type + "-" + add.id).remove();
	
	delete data[add.type][add.id];
	//TODO edit table
}

function editChip(add) {
	let ret = data[add.type][add.id] != add.text;
	for (let d in data[add.type]) {
		if (data[add.type].hasOwnProperty(d) && d != add.id && data[add.type][d] == add.text) {
			Materialize.toast("That entry already exists. This entry will revert to what it was before.", 3000);
			add.text = data[add.type][add.id];
			ret = false;
		}
	}
			
	let $chip = $("#" + add.type + "-" + add.id);
	if ($chip.hasClass("selected")) {
		$chip.removeClass("selected");
		$chip.children(".chip-input").remove();
		$("<span>").addClass("chip-text").text(add.text).prependTo($chip);
	} else {
		$chip.children(".chip-text").text(add.text);
	}
		
	data[add.type][add.id] = add.text;
	
	//TODO edit table
	
	return ret;
}

$(document).ready(() => {
	// TODO: highlight bordered striped responsive-table
    
	// Set up socket
	socket = io();
	socket.on("success", () => {
		$(".preloader-wrapper").removeClass("active");
	});
	
	socket.on("change", reload);
	
	socket.on("add", addChip);
	
	socket.on("edit", editChip);
	
	socket.on("remove", removeChip);
	
	
	Offline.on("down", () => {
		$("main, .fixed-action-btn").fadeOut();
		$(".bottom-sheet").closeModal();
		Materialize.toast("You've gone offline. You will be unable to edit until you go back online.", 10000);
	});
	
	Offline.on("up", () => {
		$("main, .fixed-action-btn").fadeIn();
		startProgress("change");
	});
	
	// Materialize
	$('.modal-trigger').leanModal();
	
	// Populate modals
	$(".bottom-sheet").each(function() {
		let $content = $(this).children(".modal-content");
		
		let $container = $("<div>").addClass("chips");
		
		$container.append($("<input>").addClass("input").addClass("new-chip"));
		
		$content.append($container);
	});
	
	$(".new-chip").on('keypress', function(e) {
		if (e.which == 13) { // Enter
			let add = {type: $(this).parent().parent().parent().attr("id").split("-")[1], text: $(this).val()};
			
			for (let d in data[add.type]) {
				if (data[add.type].hasOwnProperty(d) && data[add.type][d] == add.text) {
					Materialize.toast("That entry already exists. It cannot be added again.", 3000);
					return false;
				}
			}
			
			startProgress("add", add);
			
			$(".new-chip").val("");
			return false;
		}
	});
	
	// Add progress bars
	
	$("header, .modal").each(function() {
		let $inner = $('<div class="spinner-layer spinner-red-only">');
		$inner.append($('<div class="circle-clipper left">'));
		$inner.append($('<div class="gap-patch">'));
		$inner.append($('<div class="circle-clipper right">'));
		
		$('<div class="preloader-wrapper small" style="position: absolute; right: 2em; top: 2em;">')
			.appendTo($(this)).append($inner);
			
		$inner.children().each(function() {
			$(this).append($('<div class="circle">'));
		});
	});
	
	reload(data);
});
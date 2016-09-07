var socket;
let types = [];
let links = {col: "table"};

function reload(d = data) {
	data = d;
	
	$(".chip").remove();
	$("main").empty();
	
	let headers = {};
	
	for (let type of types) {
		for (let d in data[type]) {
			if (!data[type].hasOwnProperty(d)) {
				continue;
			}
			setChip(type, d);
			if (type == "table") {
				let $table = $('<table class="row container bordered striped responsive-table">');
				$table.attr("id", d);
				$table.append($('<thead>').append($('<tr>').append($("<td>").addClass("red-text text-darken-4").text(data[type][d].text))));
				$table.append($('<tbody>'));
				$("main").append($table);
				
				$table.hide();
			} else if (type == "col") {
				$("table").each(function() {
					let tid = $(this).attr("id");
					if (tid == data[type][d].link) {
						$(this).children("thead").children("tr").each(function() {	
							$(this).append($("<th>").text(data[type][d].text).attr("id", d));
						});
						
						if (!(tid in headers)) {
							headers[tid] = [];
						}
						headers[tid].push(d);
					}
				});
			} else if (type == "row") {
				$("tbody").each(function() {
					let $row = $("<tr>").attr("id", d);
					$row.append($("<td>").text(data[type][d].text));
					$(this).append($row);
				});
			}
		}
	}
	$("table").each(function(index) {
		let tid = $(this).attr("id");
		$(this).children("tbody").children("tr").each(function() {
			if (!(tid in headers)) {
				return;
			}
			for (let i = 0; i < headers[tid].length; i++) {
				// room - mentor - time
				let r = $(this).attr("id");
				let $cell = $("<td>").attr("id", tid + "-" + headers[tid][i] + "-" + $(this).attr("id"));
				$cell.addClass("row-" + headers[tid][i]);
				
				let $select = $("<select>");
				$select.append($('<option value="" selected>').text("?"));
				for (let d in data["entry"]) {
					if (!data["entry"].hasOwnProperty(d)) {
						continue;
					}
					$select.append($("<option>").attr("value", d).text(data["entry"][d].text));
				}
				$cell.append($select);
				
				$(this).append($cell);
				
				$select.material_select();
				
				$select.on("change", function() {
					let add = {table: tid, col: headers[tid][i], row: r, entry: $(this).val()};
					startProgress("set", add);
					setEntry(add);
				});
			}
		});
		
		$(this).fadeIn(1000 * (index + 1));
	});
	
	for (let key in data.data) {
		if (data.data.hasOwnProperty(key)) {
			setEntry({table: key.split("-")[0], col: key.split("-")[1], row: key.split("-")[2], entry: data.data[key]});
		}
	}
}

function setEntry(set) {
	$("#" + set.table + "-" + set.col + "-" + set.row).find("select").val(set.entry).material_select();
	if (!set.entry) {
		delete data.data[set.table + "-" + set.col + "-" + set.row];
	} else {
		data.data[set.table + "-" + set.col + "-" + set.row] = set.entry;
	}
	// Find constraints
	let entry = {}; 
	
	
	$("table").find("select").each(function() {
		let $select = $(this);
		if ($select.val() != "" && $select.val() != null) {
			if (!($select.val() in entry)) {
				entry[$select.val()] = {count: 0, rows: {}};
			}
			entry[$select.val()].count++;
			
			let rid = $select.parent().parent().attr("id").split("-")[2];
			if (!(rid in entry[$select.val()].rows)) {
				entry[$select.val()].rows[rid] = 0;
			}
			entry[$select.val()].rows[rid]++;
		}
	});
	
	$("table").find("select").each(function() {
		let $select = $(this);
		$select.parent().parent().removeClass("red").removeClass("red-text")
				.removeClass("darken-2").removeClass("text-darken-2")
				.removeClass("lighten-4").removeClass("text-lighten-4");
		if ($select.val() != "" && $select.val() != null) {
			let e = entry[$select.val()];
			if (e.count > 2) {
				$select.parent().parent().addClass("red").addClass("red-text")
							.addClass("text-lighten-4").addClass("darken-2");
				// candidates more than 2: dark red fill, white text
			} else {
				for (let r in e.rows) {
					if (e.rows.hasOwnProperty(r) && e.rows[r] > 1) {
						$select.parent().parent().addClass("red-text").addClass("red")
								.addClass("text-darken-2").addClass("lighten-4");
						break;
					}
				}
				// candidates two in same row: light red fill, dark red text
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
		if ($chip.attr("id").split("-").length > 2) {
			add.link = $chip.attr("id").split("-")[2];//$chip.children(".new-select").children(".initialized").val();
		}
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
	let link = false;
	let type = $chip.attr("id").split("-")[0];
	
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

function setChip(type, d) {
	let add = data[type][d];
	let id = type + "-" + d;
	if (add.link) {
		id += "-" + add.link;
	}
	
	let $container = $("#modal-" + type).children(".modal-content").children(".chips");
	
	let $ch = $("<div>").addClass("chip").attr("id", id);
	$ch.append($("<span>").addClass("chip-text").text(add.text));
	if (add.link) {
		$ch.append($("<span>").addClass("chip-link").text(" (" + data[links[type]][add.link].text + ")"));
	}
	
	let $close = $("<i>").addClass("close").addClass("material-icons").text("close");
	let $edit = $("<i>").addClass("edit").addClass("material-icons").text("mode_edit");
	
	$ch.append($close);
	$ch.append($edit);
	
	$close.on("click", function(e) {
		let add = {id: d, "type": type};
		startProgress("remove", add);
		
		removeChip(add, true);
	});
	$edit.on("click", () => selectChip($ch));

	
	$container.children(".new-chip").before($ch);
}

function addChip(add) {
	data[add.type][add.id] = {text: add.text};
	if (add.link) {
		data[add.type][add.id].link = add.link;
	}
		
	setChip(add.type, add.id);
	
	for (let link in links) {
		if (links.hasOwnProperty(link) && links[link] == add.type) {
			// Reverse link
			let $select = $("#modal-" + link).children(".modal-content").children(".chips").children(".new-select").children(".initialized");
			$select.append($("<option>").attr("value", add.id).text(add.text));
			$select.material_select();
		}
	}
	
	reload();
}

function removeChip(add, ours = false) {
	$("#" + add.type + "-" + add.id + (add.link ? "-" + add.link : "")).remove();
	
	$("#" + add.id).remove();
	$(".row-" + add.id).remove();
	
	
	for (let link in links) {
		if (links.hasOwnProperty(link) && links[link] == add.type) {
			// Reverse link
			let $select = $("#modal-" + link).children(".modal-content").children(".chips").children(".new-select").children(".initialized");
			$select.children("option").each(function() {
				if ($(this).attr("value") == add.id) {
					$(this).remove();
				}
			});
			$select.material_select();
			
			// Remove all chips with #link-???-add.id
			$(".chip").each(function() {
				if ($(this).attr("id").split("-").length == 3 && $(this).attr("id").split("-")[0] == link && $(this).attr("id").split("-")[2] == add.id) {
					let addi = {type: link, id: $(this).attr("id").split("-")[1], "link": add.id};
					if (ours) {
						startProgress("remove", addi);
					}
					removeChip(addi);
				}
			});
		}
	}
	
	if (add.type == "entry") {
		let $opts = $("table").find('option[value="' + add.id + '"]');
		let $select = $opts.parent();
		$opts.remove();
		$select.val(null).material_select();
	}
	
	for (let d in data.data) {
		if (data.data.hasOwnProperty(d)) {
			if (d.split("-")[0] == add.id || d.split("-")[1] == add.id || d.split("-")[2] == add.id || data.data[d] == add.id) {
				delete data.data[d];
			}
		}
	}
	
	delete data[add.type][add.id];
}

function editChip(add) {
	let ret = (data[add.type][add.id].text != add.text);
	for (let d in data[add.type]) {
		if (data[add.type].hasOwnProperty(d) && d != add.id && data[add.type][d].text == add.text) {
			Materialize.toast("That entry already exists. This entry will revert to what it was before.", 3000);
			add.text = data[add.type][add.id].text;
			ret = false;
		}
	}
	let $chip = null;
	
	$(".chip").each(function() {
		if ($(this).attr("id").split("-")[0] == add.type && $(this).attr("id").split("-")[1] == add.id) {
			$chip = $(this);
		}
	});
	
	if ($chip == null) {
		console.log("IMPOSSIBLE");
		return;
	}
	$chip.attr("id", add.type + "-" + add.id + (add.link ? "-" + add.link : ""));
	if ($chip.hasClass("selected")) {
		$chip.removeClass("selected");
		$chip.children(".chip-input").remove();
		//$chip.children(".new-select").remove();
		//if (add.link) {
		//	$("<span>").addClass("chip-link").text(" (" + data[links[add.type]][add.link].text + ")").prependTo($chip);
		//}
		$("<span>").addClass("chip-text").text(add.text).prependTo($chip);
	} else {
		$chip.children(".chip-text").text(add.text);
		if (add.link) {
			$chip.children(".chip-link").text(" (" + data[links[add.type]][add.link].text + ")");
		}
	}
		
	data[add.type][add.id].text = add.text;
	if (add.link) {
		data[add.type][add.id].link = add.link;
	}
	
	for (let link in links) {
		if (links.hasOwnProperty(link) && links[link] == add.type) {
			// Reverse link
			let $chips = $("#modal-" + link).children(".modal-content").children(".chips");
			
			let $select = $chips.children(".new-select").children(".initialized");
			$select.children('option[value="' + add.id + '"]').text(add.text);
			$select.material_select();
			
			$chips.children(".chip").each(function() {
				if ($(this).attr("id").split("-")[2] == add.id) {
					$(this).children(".chip-link").text(" (" + add.text + ")");
				}
			});
		}
	}
	if (add.type == "table") {
		$("#" + add.id).children("thead").children("tr").children("td").first().text(add.text);
	} else if (add.type == "col") {
		$("#" + add.id).text(add.text);
	} else if (add.type == "row") {
		$("#" + add.id).children("td").first().text(add.text);
	} else {
		$("table").find('option[value="' + add.id + '"]').text(add.text);
	}
	
	return ret;
}

$(document).ready(() => {
	$(".bottom-sheet").each(function() {
		types.push($(this).attr("id").substr(6));
	});
	
	// Set up socket
	socket = io();
	socket.on("success", () => $(".preloader-wrapper").removeClass("active"));
	socket.on("change", reload);
	socket.on("add", addChip);
	socket.on("edit", editChip);
	socket.on("remove", removeChip);
	socket.on("set", setEntry);
	
	// Set up offline
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
		let type = $(this).attr("id").substr(6);
		let $container = $("<div>").addClass("chips");
		
		$container.append($("<input>").addClass("input").addClass("new-chip").addClass("validate").attr("placeholder", "New entry..."));
		
		let $select = null;
		
		if (type in links) {
			$select = $("<select>").addClass("new-select");
			$select.append($('<option disabled selected>').text("?"));
			for (let d in data[links[type]]) {
				if (!data[links[type]].hasOwnProperty(d)) {
					continue;
				}
				$select.append($("<option>").attr("value", d).text(data[links[type]][d].text));
			}
			$container.append($select);	
		}
		
		$content.append($container);
		
		if ($select !== null) {
			$select.material_select();
		}
	});
	
	$(".new-chip").on('keypress', function(e) {
		if (e.which == 13) { // Enter
			if ($(this).val().length == 0) {
				
				$(this).addClass("invalid");
				return false;
			}
		
			let add = {type: $(this).parent().parent().parent().attr("id").split("-")[1], text: $(this).val()};
			
			if (add.type in links) {
				let $select = $(this).parent().children(".new-select").children(".initialized");
				if (!($select.val() in data[links[add.type]])) {
					Materialize.toast("Please select an option first.", 3000);
					return false;
				}
				add.link = $select.val();
			}
			
			for (let d in data[add.type]) {
				if (data[add.type].hasOwnProperty(d) && data[add.type][d].text == add.text) {
					$(this).addClass("invalid");
					Materialize.toast("That entry already exists. It cannot be added again.", 3000);
					return false;
				}
			}
			
			startProgress("add", add);
			$(this).removeClass("invalid");
			$(this).val("");
			return false;
		}
	});
	
	// Add progress bar
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
	
	reload();
});
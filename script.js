// https://stackoverflow.com/questions/512528/set-cursor-position-in-html-textbox
function setCaretPosition(id, position) {
    var el = document.getElementById(id);

    el.value = el.value;
    // ^ this is used to not only get "focus", but
    // to make sure we don't have it everything -selected-
    // (it causes an issue in chrome, and having it doesn't hurt any other browser)

    if (el !== null) {

        if (el.createTextRange) {
            var range = el.createTextRange();
            range.move('character', position);
            range.select();
            return true;
        } else {
            // (el.selectionStart === 0 added for Firefox bug)
            if (el.selectionStart || el.selectionStart === 0) {
                el.focus();
                el.setSelectionRange(position, position);
                return true;
            } else  { // fail city, fortunately this never happens (as far as I've tested) :)
                el.focus();
                return false;
            }
        }
    }
}

function ascii_table() {
    var descriptions = ["nul", "soh", "stx", "etx", "eot", "enq", "ack", "bel", "bs", "ht", "nl", "vt", "np", "cr", "so", "si", "dle", "dc1", "dc2", "dc3", "dc4", "nak", "syn", "etb", "can", "em", "sub", "esc", "fs", "gs", "rs", "us", "sp"];

    for(var i=0; i<33; i++) {
        $('#ascii-table tbody').append('<tr><td>' + i + '</td><td>' + descriptions[i] + '</td></tr>');
    }
    for(var i=33; i<256; i++) {
        $('#ascii-table tbody').append('<tr><td>' + i + '</td><td>' + String.fromCharCode(i) + '</td></tr>');
    }
}

function save(filename) {
    var sdcard = navigator.getDeviceStorage("sdcard");
    var file = new Blob([$("#code").val()], {type: "text/plain"});

    var request = sdcard.addNamed(file, filename);

    request.onsuccess = function () {
      var name = this.result;
      alert('File "' + name + '" successfully wrote on the sdcard !');
    }

    // An error typically occur if a file with the same name already exist
    request.onerror = function () {
      alert('Unable to write the file: ' + this.error);
      console.log(this.error);
    }
}

function load(filename) {
    var sdcard = navigator.getDeviceStorage('sdcard');

    var request = sdcard.get(filename);

    request.onsuccess = function () {
        var file = this.result;
        $("#code").val(JSON.stringify(file));
        alert('Success !');
    }

    request.onerror = function () {
        alert("Unable to get the file: " + this.error);
    }
}

$(function() {
    $('#tools, #ascii-table').hide();
    window.localStorage.setItem('limit', parseInt(window.localStorage.getItem('limit')) || 5000);
    ascii_table();

    $('#save, #save-as, #load').each(function() {
        $(this).prop('disabled', !("getDeviceStorage" in navigator));
    });

    $('.controls').click(function() {
        var caret = $('#code').get(0).selectionStart;
        $("#code").val($('#code').val().substring(0, caret) + $(this).text() + $('#code').val().substring(caret));
        setCaretPosition('code', caret + $(this).text().length);
    });

    $('.toggle-tools').click(function() {
        $('#ide, #tools').slideToggle();
    });

    // Tools
    $('#save').click(function() {
        var filename = prompt('File name ?');
        if(filename) {
            save(filename + '.bf');
        }
    });

    $('#load').click(function() {
        var filename = prompt('File name ?');
        if(filename) {
            load(filename + '.bf');
        }
    });

    $('#ascii').click(function() {
        $('#code, #ascii-table').slideToggle();
    });

    $('#exec-limit').click(function() {
        var limit = prompt('Limit of commands to execute ? (current: ' + (window.localStorage.getItem('limit')) + ')');
        if(limit) {
            window.localStorage.setItem('limit', limit);
        }
    });

    $('#clear').click(function() {
        confirm('Clear all code ?') && $('#code').val('');
    });

    $('#minify').click(function() {
        var commands = $('#code').val().split('');
        var minified = "";
        for(index in commands) {
            if(['+', '-', '.', ',', '>', '<', '[', ']'].indexOf(commands[index]) != -1) {
                minified += commands[index];
            }
        }
        $('#code').val(minified);
    });

    $('#insert').click(function() {
        var character = prompt('Char ?');

        if(!character) {
            return;
        }

        var times = parseInt(prompt('Times ?'));

        var caret = $('#code').get(0).selectionStart;
        $("#code").val($('#code').val().substring(0, caret) + character.repeat(times) + $('#code').val().substring(caret));
        setCaretPosition('code', caret + times);
    });

    $('#backspace').click(function() {
        var caret = $('#code').get(0).selectionStart;
        $("#code").val($('#code').val().substring(0, caret - 1) + $('#code').val().substring(caret));
        setCaretPosition('code', caret - 1);
    });

    $('#return').click(function() {
        var caret = $('#code').get(0).selectionStart;
        $("#code").val($('#code').val().substring(0, caret) + "\n" + $('#code').val().substring(caret));
        setCaretPosition('code', caret + $(this).text().length);
    });

    $('#run').click(function() {
        var program = new Brainfuck($('#code').val());
        var output = "";
        program.write = function(charCode) {
            output += String.fromCharCode(charCode);
        };

        program.read = function() {
            // Canceling the prompt will make the interpreter fail, which kind of cancel the execution...
            // Meh, it's not a bug, it's a feature ;)
            alert(output);
            output = "";
            return String.charCodeAt(prompt('Input'), 0);
        };

        var loop = true;
        while(loop) {
            program.run(window.localStorage.limit);
            if(program.code[program.ip]) {
                loop = confirm("Lots of code... Continue ?");
            } else {
                loop = false;
            }
        }

        if(output) {
            alert(output);
        }
    });

    $('button').click(function() {
        $('#code').focus();
        navigator.vibrate(55);
    });
});

  currentNote = null;
  currentNoteStatus = false;
  currentNotePosition = null;


  let midiOut = [];

  connect();
  // Start up WebMidi.
  function connect() {
    navigator.requestMIDIAccess()
    .then(
      (midi) => midiReady(midi),
          (err) => console.log('Something went wrong', err));
  }

  function midiReady(midi) {
    // Also react to device changes.
    midi.addEventListener('statechange', (event) => initDevices(event.target));
    initDevices(midi);
  }

  function initDevices(midi) {
    // Reset.
    midiOut = [];

    // MIDI devices that you send data to.
    const outputs = midi.outputs.values();
    for (let output = outputs.next(); output && !output.done; output = outputs.next()) {
      midiOut.push(output.value);
    }

    displayDevices();
  }

  function displayDevices() {
    selectOut = document.getElementById("selectOut");
    selectOut.innerHTML = midiOut.map(device => `<option>${device.name}</option>`).join('');
  }



  function noteOn(note,notePosition) {
    const selectOut = document.getElementById("selectOut");
    messageElem = document.getElementById("message");
    messageElem.innerHTML = `${note} Note ON`;
    messageElem = document.getElementById("pitchbend");
    messageElem.innerHTML = 'pitchbend = 8192';
    currentNote = note;
    currentNoteStatus = true;
    currentNotePosition = parseInt(notePosition) - 1;
    const msg = [0x90, 60+currentNotePosition , 100];
    const device = midiOut[selectOut.selectedIndex];
    device.send(msg)
  }

  function noteOff() {
    const selectOut = document.getElementById("selectOut");
    messageElem = document.getElementById("message");
    messageElem.innerHTML = `${currentNote} Note OFF`;
    currentNoteStatus = false;

    const msg = [0x80, 60+currentNotePosition , 100];
    const device = midiOut[selectOut.selectedIndex];
    device.send(msg)
  }

  function convertToPitchBend(value, channel = 0) {
    // 1. Constrain value to 14-bit range (0 to 16383)
    const constrainedValue = Math.max(0, Math.min(16383, Math.round(value)));

    // 2. Extract LSB and MSB (7 bits each)
    const lsb = constrainedValue & 0x7F;      // Lower 7 bits
    const msb = (constrainedValue >> 7) & 0x7F; // Upper 7 bits

    // 3. Status byte for Pitch Bend is 0xE0 + channel (0-15)
    const statusByte = 0xE0 | (channel & 0x0F);

    // Return the 3-byte MIDI message
    return [statusByte, lsb, msb];
  }


  document.addEventListener('mousemove', (event) => {
    const x = event.clientX;
    const y = event.clientY;
    const width = document.getElementById("main").offsetWidth;
    const xmin = -1*width*(11/12)
    const xmax = width
    const ymin = 0
    const ymax = 2**14 -1
    const selectOut = document.getElementById("selectOut");

    if (currentNoteStatus){
      messageElem = document.getElementById("pitchbend");
      const x1 = x - (currentNotePosition * width)/12;
      const device = midiOut[selectOut.selectedIndex];
      const pitchBend = Math.round((((x1 - xmin)*(ymax-ymin))/(xmax-xmin)) + ymin)
      device.send(convertToPitchBend(pitchBend))
      messageElem.innerHTML = `pitchbend = ${Math.round(pitchBend)}`;

    }
});


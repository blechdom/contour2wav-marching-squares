
class MarchingSquares {
	constructor(canvasId, args = {}) {
		this.main_canvas = document.getElementById(canvasId);
		this.ctx = this.main_canvas.getContext("2d");
		this.inputValues = juliaDataBig;
		console.log("input values: ", JSON.stringify(this.inputValues));
		this.gridValues = [];
		this.contour = [];
		this.contourX = [];
		this.contourY = [];
		this.startingPoint = {
			x: 0,
			y: Math.floor(this.inputValues.length / 2)
		};

		let rect = this.main_canvas.getBoundingClientRect();
		this.main_canvas.width = rect.width;
		this.main_canvas.height = rect.height;
		this.ctx.font = "1px Arial";
		this.ctx.lineWidth = 1;

		this.width = rect.width;
		this.height = rect.height;

		this.rez = 1; //Math.floor(this.main_canvas.height / this.inputValues.length) ?? 1;
		console.log("Rez:", this.rez);
		if ("interpolation" in args) this.interpolation = args.interpolation;
		else this.interpolation = true;

		this.generateAll = (async () => {
				this.updateGridPoints();
				this.drawLines();
				await this.traceContour(this.startingPoint.x, this.startingPoint.y);

				let audioContext = new AudioContext();
				let audioBuffer = audioContext.createBuffer(2, this.contourX.length, 44100);
				let xArray = audioBuffer.getChannelData(0);
				let yArray = audioBuffer.getChannelData(1);
				for(let i = 0; i< this.contourX.length; i++){
					xArray[i] = this.contourX[i];
					yArray[i] = this.contourY[i];
				}

				let src = audioContext.createBufferSource();
				src.buffer = audioBuffer;

				console.log('contour: ', JSON.stringify(this.contour));
				console.log('stereo data audio buffer: ', src.buffer);

				make_download(src.buffer, 44100 * audioBuffer.duration);

			});

		console.log(
			"initialized MarchingSquares class for",
			this.main_canvas,
			"with arguments",
			args
		);

		this.generateMap();
		this.generateAll();
	}

	generateMap() {
		this.gridValues = new Array(this.inputValues.length - 1);
		for (var y = 0; y < this.gridValues.length; y++)
			this.gridValues[y] = new Array(this.inputValues[0].length - 1);
	}

	updateGridPoints() {

		for (var y = 0; y < this.gridValues.length; y++) {
			for (var x = 0; x < this.gridValues[y].length; x++) {
				this.gridValues[y][x] = binaryToType(
					this.inputValues[y][x] > 0,
					this.inputValues[y][x + 1] > 0,
					this.inputValues[y + 1][x + 1] > 0,
					this.inputValues[y + 1][x] > 0
				);
			}
		}
	}

	line(from, to) {
		this.ctx.moveTo(from[0], from[1]);
		this.ctx.lineTo(to[0], to[1]);
	}

	drawLines() {
		this.ctx.beginPath();
		this.ctx.lineWidth = 1;
		this.ctx.strokeStyle = secondary;
		for (var y = 0; y < this.gridValues.length; y++) {
			for (var x = 0; x < this.gridValues[y].length; x++) {
				if (!this.interpolation) {
					//abcd uninterpolated
					var a = [x * this.rez + this.rez / 2, y * this.rez];
					var b = [x * this.rez + this.rez, y * this.rez + this.rez / 2];
					var c = [x * this.rez + this.rez / 2, y * this.rez + this.rez];
					var d = [x * this.rez, y * this.rez + this.rez / 2];
				} else {
					//abcd interpolated
					var nw = this.inputValues[y][x];
					var ne = this.inputValues[y][x + 1];
					var se = this.inputValues[y + 1][x + 1];
					var sw = this.inputValues[y + 1][x];
					var a = [x * this.rez + this.rez * lerp(1, nw, ne), y * this.rez];
					var b = [
						x * this.rez + this.rez,
						y * this.rez + this.rez * lerp(1, ne, se)
					];
					var c = [
						x * this.rez + this.rez * lerp(1, sw, se),
						y * this.rez + this.rez
					];
					var d = [x * this.rez, y * this.rez + this.rez * lerp(1, nw, sw)];
				}

				switch (this.gridValues[y][x]) {
					case 1:
					case 14:
						this.line(d, c);
						break;

					case 2:
					case 13:
						this.line(b, c);
						break;

					case 3:
					case 12:
						this.line(d, b);
						break;

					case 11:
					case 4:
						this.line(a, b);
						break;

					case 5:
						this.line(d, a);
						this.line(c, b);
						break;
					case 6:
					case 9:
						this.line(c, a);
						break;

					case 7:
					case 8:
						this.line(d, a);
						break;

					case 10:
						this.line(a, b);
						this.line(c, d);
						break;
					default:
						break;
				}
			}
		}
		this.ctx.stroke();
	}

	traceContour(x, y) {
	//	console.log('x: ', x, ' y: ', y);
	/*

	      A
	   o --- o
	D  |     |  B
	   o --- o
	      C

	0000	0 - right but don't write, looking for a boundary
	0001	1 DOWN: 	D -> C
	0010	2 RIGHT: 	C -> B
	0011	3 RIGHT: 	D -> B
	0100	4 UP:			B -> A
	0101	5 if (lastCoord === thisCoord.D)
							then	UP: 	D -> A
							else 	DOWN: B -> C		(lastCoord === thisCoord.B)
	0110	6 UP:			C -> A
	0111  7 UP:			D -> A
	1000	8 LEFT:	  A -> D
	1001	9 DOWN:		A -> C
	1010	10 if (lastCoord === thisCoord.C)
							then 	LEFT:		C -> D
							else 	RIGHT:	A -> B	  (lastCoord === thisCoord.A)
	1011	11 RIGHT:	A -> B
	1100	12 LEFT:	B -> D
	1101	13 DOWN:	B -> C
	1110	14 LEFT:	C -> D
	1111	15 - shouldn't happen...

	 */

			let a = { x: x + 0.5, y: y - 1};
			let b = { x: x + 1, y: y - 0.5};
			let c = { x: x + 0.5, y};
			let d = { x, y: y - 0.5};

			let up = { x, y: y - 1};
			let down = { x, y: y + 1};
			let left = { x: x - 1, y};
			let right = { x: x + 1, y};

		/*	console.log("nw ", this.inputValues[y][x],
									"ne ", this.inputValues[y][x + 1],
									"se ", this.inputValues[y + 1][x + 1],
									"sw ", this.inputValues[y + 1][x]);*/

			let squareType = binaryToType(   // nw, ne, se, sw
					this.inputValues[y][x] === 0,
					this.inputValues[y][x + 1] === 0,
					this.inputValues[y + 1][x + 1] === 0,
					this.inputValues[y + 1][x] === 0
				);
		//	console.log('squareType: ', squareType);

			let pointToWrite = null;
			let nextPoint = null;

			switch (squareType) {
				case 0: // right but don't write, looking for a boundary
					nextPoint = right;
					break;
				case 1: // DOWN: 	D -> C
					pointToWrite = c;
					nextPoint = down;
					break;
				case 2: // RIGHT: 	C -> B
					pointToWrite = b;
					nextPoint = right;
					break;
				case 3: // RIGHT: 	D -> B
					pointToWrite = b;
					nextPoint = right;
					break;
				case 4: // UP:			B -> A
					pointToWrite = a;
					nextPoint = up;
					break;
				case 5: /* if (lastCoord === thisCoord.D)
											then	UP: 	D -> A
											else 	DOWN: B -> C		(lastCoord === thisCoord.B)
								*/
				//	console.log("CASE 5: previous point: ", this.contour[this.contour.length-1]);
				//	console.log("CASE 5: current d: ", d);
			//		console.log("CASE 5: current b: ", b);
					if(JSON.stringify(this.contour[this.contour.length-1]) === JSON.stringify(d)) {
						pointToWrite = a;
						nextPoint = up;
					} else if(JSON.stringify(this.contour[this.contour.length-1]) === JSON.stringify(b)) {
						pointToWrite = c;
						nextPoint = down;
					}
					break;
				case 6: // UP:			C -> A
					pointToWrite = a;
					nextPoint = up;
					break;
				case 7: // UP:			D -> A
					pointToWrite = a;
					nextPoint = up;
					break;
				case 8: // LEFT:	  A -> D
					pointToWrite = d;
					nextPoint = left;
					break;
				case 9: // DOWN:		A -> C
					pointToWrite = c;
					nextPoint = down;
					break;
				case 10: /* if (lastCoord === thisCoord.C)
											then 	LEFT:		C -> D
											else 	RIGHT:	A -> B	  (lastCoord === thisCoord.A)
								*/
				//	console.log("CASE 10: previous point: ", this.contour[this.contour.length-1]);
				//	console.log("CASE 10: current c: ", c);
			//		console.log("CASE 10: current a: ", a);
					if(JSON.stringify(this.contour[this.contour.length-1]) === JSON.stringify(c)) {
						pointToWrite	= d;
						nextPoint = left;
					} else if(JSON.stringify(this.contour[this.contour.length-1]) === JSON.stringify(a)) {
						pointToWrite = b;
						nextPoint = right;
					}
					break;
				case 11: // RIGHT:	A -> B
					pointToWrite = b;
					nextPoint = right;
					break;
				case 12: // LEFT:	B -> D
					pointToWrite = d;
					nextPoint = left;
					break;
				case 13: // DOWN:	B -> C
					pointToWrite = c;
					nextPoint = down;
					break;
				case 14: // LEFT:	C -> D
					pointToWrite = d;
					nextPoint = left;
					break;
				case 15: // shouldn't happen...
					console.log('error, case 15 happened');
					break;
				default:
					break;
			}
			if (nextPoint.y > this.inputValues.length || nextPoint.x > this.inputValues[0].length || nextPoint.x < 0 || nextPoint.y < 0) return;
			console.log("point to write", pointToWrite);
			if(JSON.stringify(pointToWrite) === JSON.stringify(this.contour[0])) return;
			if (pointToWrite !== null) {
				this.contour.push(pointToWrite);
				let newX = (pointToWrite.x / (this.inputValues[0].length / 2)) - 1.0;
				this.contourX.push(newX);
				let newY = (pointToWrite.y / (this.inputValues.length / 2)) - 1.0;
				this.contourY.push(newY);
			}
				this.traceContour(nextPoint.x, nextPoint.y);
		}
}

function lerp(x, x0, x1, y0 = 0, y1 = 1) {
	if (x0 === x1) {
		return null;
	}

	return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

function binaryToType(nw, ne, se, sw) {
	a = [nw, ne, se, sw];
	return a.reduce((res, x) => (res << 1) | x);
}

function bufferToWave(abuffer, len) {
  var numOfChan = abuffer.numberOfChannels,
      length = len * numOfChan * 2 + 44,
      buffer = new ArrayBuffer(length),
      view = new DataView(buffer),
      channels = [], i, sample,
      offset = 0,
      pos = 0;

  // write WAVE header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"

  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit (hardcoded in this demo)

  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length - pos - 4);                   // chunk length

  // write interleaved data
  for(i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while(pos < length) {
    for(i = 0; i < numOfChan; i++) {             // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true);          // write 16-bit sample
      pos += 2;
    }
    offset++                                     // next source sample
  }

  // create Blob
  return new Blob([buffer], {type: "audio/wav"});

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

function make_download(abuffer, total_samples) {

	var new_file = URL.createObjectURL(bufferToWave(abuffer, total_samples));

	var download_link = document.getElementById("download_link");
	download_link.href = new_file;
	var name = 'dufus-' + new Date().toISOString() + '.wav';
	download_link.download = name;

}
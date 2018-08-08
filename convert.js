// console.log(process.stdin);

process.stdin.resume();
process.stdin.setEncoding('utf-8');

function exportCSVFile(csv, fileTitle) {
  var exportedFilenmae = fileTitle + '.csv' || 'export.csv';

  var blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;'
  });
  if (navigator.msSaveBlob) { // IE 10+
    navigator.msSaveBlob(blob, exportedFilenmae);
  } else {
    var link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", exportedFilenmae);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

function jsonToCSV(json) {
  let headers = Object.keys(json["pangolier"]);
  let heroes = Object.keys(json);

  const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
  let csv = heroes.map(heroName => headers.map(fieldName => JSON.stringify(json[heroName][fieldName], replacer)).join(','))
  csv.unshift(headers.join(','))
  csv = csv.join('\r\n')

  return csv;
}

let chunks = [];
// let json = null;

process.stdin.on('data', (chunk) => {
  chunks.push(chunk);
})

process.stdin.on('end', () => {
  let inputJSON = chunks.join("");
  let parsedData = JSON.parse(inputJSON);
  // let outputJSON = JSON.stringify(parsedData, null, '  ');
  
  console.log(parsedData);
  let csv = jsonToCSV(parsedData);
  exportCSVFile(csv, "heroes");
  // let headers = Object.keys(parsedData["pangolier"]);
  // const heroes = Object.keys(parsedData);

  // console.log({headers})
  // console.log({heroes});
  // const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
  // let csv = heroes.map(heroName => headers.map(fieldName => JSON.stringify(parsedData[heroName][fieldName], replacer)).join(','))
  // csv.unshift(headers.join(','))
  // csv = csv.join('\r\n')

  console.log(csv);


});


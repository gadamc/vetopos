function(doc) {
  if(doc.unixtime && doc.position=="nemo" && doc.aveValue)
  	emit(doc.unixtime, doc.aveValue);
}
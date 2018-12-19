function loadData(db, callback) {
  experimentalCatchments = db.exec("SELECT * FROM experimentalCatchments")
  if (experimentalCatchments.length <= 0) {
    return;
  }

  var parsedData = {
    rowsAll: [],
    rowByTreatment: {},
    treatmentClasses: [],
    outcomeClasses: [],
  }

  var treatmentClassesSet = new Set(),
      outcomeClassesSet = new Set();
  for(j = 0; j < experimentalCatchments[0].columns.length; ++ j) {
    if (experimentalCatchments[0].columns[j].startsWith("change_")) {
      var outcome = experimentalCatchments[0].columns[j];
      if (!outcomeClassesSet.has(outcome)) {
        if (outcome !== "change_groundwater_recharge") {
          outcomeClassesSet.add(outcome);
        }
      }
    }
  }
  parsedData.outcomeClasses = [...outcomeClassesSet];
  function customizer(objValue, srcValue) {
    if (_.isNumber(objValue) && _.isNumber(srcValue)) {
      return objValue + srcValue;
    }
  }
  for(i = 0; i < experimentalCatchments[0].values.length; ++ i) {
    obj = {}
    for(j = 0; j < experimentalCatchments[0].columns.length; ++ j) {
      obj[experimentalCatchments[0].columns[j]] = experimentalCatchments[0].values[i][j];
    }
    if (!treatmentClassesSet.has(obj.treatment_class)) {
      treatmentClassesSet.add(obj.treatment_class);
    }
    parsedData.treatmentClasses = [...treatmentClassesSet];
    parsedData.rowsAll.push(obj);

    if (!parsedData.rowByTreatment[obj.treatment_class]) {
      parsedData.rowByTreatment[obj.treatment_class] = {}
    }
    parsedData.outcomeClasses.forEach(function(outcome) {
      if (!parsedData.rowByTreatment[obj.treatment_class][outcome]) {
        parsedData.rowByTreatment[obj.treatment_class][outcome] = {
          Decrease: 0,
          Neutral: 0,
          Increase: 0,
          SigDecrease: 0,
          SigNeutral: 0,
          SigIncrease: 0,
        }
      }
      if (obj[outcome] < 0) {
        parsedData.rowByTreatment[obj.treatment_class][outcome].Decrease ++;
        if(obj[sigChangeNames[outcome]]) {
          parsedData.rowByTreatment[obj.treatment_class][outcome].SigDecrease ++;
        }
      } else if (obj[outcome] == 0) {
        parsedData.rowByTreatment[obj.treatment_class][outcome].Neutral ++;
        if(obj[sigChangeNames[outcome]]) {
          parsedData.rowByTreatment[obj.treatment_class][outcome].SigNeutral ++;
        }
      } else if (obj[outcome] > 0) {
        parsedData.rowByTreatment[obj.treatment_class][outcome].Increase ++;
        if(obj[sigChangeNames[outcome]]) {
          parsedData.rowByTreatment[obj.treatment_class][outcome].SigIncrease ++;
        }
      }
    });
  }

  callback(parsedData);
}

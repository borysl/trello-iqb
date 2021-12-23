function validateTodo(card) {
  let sins = [];
  if (card.labels.length === 0) sins.push('no labels for classification');
  if (!card.desc && card.checklists.length === 0) sins.push('neither description nor checklist');

  if (card.labels.find(_ => _.name === 'FE')) {
    if (card.attachments.length === 0) {
      sins.push('No image attached to FE task!');
    } else {
      if (!card.attachments.find(_ => _.url.startsWith('https://www.figma.com/file/')))
        sins.push('no Figma reference attached to FE task');
      if (!card.attachments.find(_ => _.fileName && (_.fileName.endsWith('.png') || _.fileName.endsWith('.jpg'))))
        sins.push('no screenshot attached to FE task');
    }
  }

  if (card.labels.find(_ => _.name === 'Bug')) {
    if (!card.desc.includes('CONDITION')) sins.push('bug contains no CONDITION');
    if (!card.desc.includes('ACTION')) sins.push('bug contains no ACTION');
    if (!card.desc.includes('EXPECTED')) sins.push('bug contains no EXPECTED');
    if (!card.desc.includes('ACTUAL')) sins.push('bug contains no ACTUAL');
    if (!card.desc.match(/\d+\.\d+\.\d+\.\d+/)) sins.push('bug contains no version');
  }
  return sins;
}

function validateWip(card) {
  let sins = validateTodo(card);

  // should have assignee

  // should have branch

  return sins;
}

function validateResolved(card) {
  let sins = validateWip(card);

  // Whether PR is created cannot be checked
  // should have all checkboxes
  return sins;
}

module.exports = {
  columns: {
    todo: 2,
    wip: 3,
    resolved: 4,
  },
  qbs: {
    todo: validateTodo,
    wip: validateWip,
    resolved: validateResolved,
  },
};

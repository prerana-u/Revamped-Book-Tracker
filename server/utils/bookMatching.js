const { normalize, stripEditionQualifiers } = require("./textUtils");

function isMatch(volumeInfo, title, author) {
  const cleanVolumeTitle = stripEditionQualifiers(volumeInfo.title);
  const cleanTargetTitle = stripEditionQualifiers(title);
  const normalizedTitle = normalize(cleanVolumeTitle);
  const normalizedAuthorList = (volumeInfo.authors || []).map(normalize);

  const targetTitle = normalize(cleanTargetTitle);
  const targetAuthor = normalize(author);

  const titleMatch =
    normalizedTitle.includes(targetTitle) ||
    targetTitle.includes(normalizedTitle);
  const authorMatch =
    !author || normalizedAuthorList.some((a) => a.includes(targetAuthor));

  return titleMatch && authorMatch;
}

module.exports = { isMatch };

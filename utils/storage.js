function safeGet(key) {
  try {
    return wx.getStorageSync(key);
  } catch (e) {
    return null;
  }
}

function safeSet(key, value) {
  try {
    wx.setStorageSync(key, value);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { safeGet, safeSet };


// 保存数据到storage
function saveToStorageSync(key, value) {
	let data = {
		[key]: value,
	};
	chrome.storage.sync.set(data).then(() => {
		// console.log("Value is set to " + value);
	});
}

// 从storage取数据
function getFromStorageSync(key, cb) {
	// 检索数据
	return new Promise((resolve) => {
		chrome.storage.sync.get([key]).then((result) => {
			resolve(result[key]);
			// 另外一种回调方式
			if (cb) {
				cb(result[key]);
			}
		});
	});
}

// 从storage移除特定数据
function removeFromStorageSync(key) {
	chrome.storage.sync.remove([key]).then((result) => {});
}

// 从storage移除所有数据
function clearAllStorage() {
	chrome.storage.sync.clear();
}

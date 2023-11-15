// 接收到信息
function receiveMsg() {
	// data数据  sender发送方  sendResponse回调
	chrome.runtime.onMessage.addListener(function (data, sender, sendResponse) {
		console.log("😝: background.js  receive", data);
		console.log("😝: background.js  receiveFn");
		sendResponse(data);
		console.log(".....................");
		tabs();
	});
}
receiveMsg();

/**
 * background 和 popup的通信函数
 */
function backFun(...arg) {
	const allViews = chrome.extension.getViews();
	console.log(arg);
	console.log("chrome.extension.getViews()：", allViews);
}

// 监测到新的tab
async function tabs() {
	const tabId = await getCurrentTabId();
	// 在背景页面发送消息，需要当前 tabID
	chrome.tabs.sendMessage(tabId, { name: "bJs" }, function (data) {
		console.log("📌: background.js  send");
		console.log("📌: background.js  sendBack", data);
		console.log(".....................");
	});
}

// 获取当前 tab ID
function getCurrentTabId() {
	return new Promise((resolve, reject) => {
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			resolve(tabs.length ? tabs[0].id : null);
		});
	});
}

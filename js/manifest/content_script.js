// 发送消息
function sendMsg(data) {
	chrome.runtime.sendMessage(data, function (res) {
		// 接受返回信息
		console.log("🔷: page.js  send");
		console.log("🔷: page.js  sendBack", res);
		console.log(".....................");
	});
}
// 接受消息
function receiveMsg() {
	chrome.runtime.onMessage.addListener(function (data, sender, sendResponse) {
		console.log("👀: page.js  receive", data);
		//
		// if (data.type === "gotoPage2") {
		// 	gotoPage2();
		// }

		console.log(".....................");
	});
}
receiveMsg();

window.onload = function () {
	// 判断local的数据日期是否是今天
	isTodayData();

	// 判断当前页面
	let currentPath = location.href;
	if (~currentPath.indexOf("/kmReviewexMain.do?method=attendanceList")) {
		// console.log("===当前页面是[考勤查询页]===");
		saveToStorageSync("currentPathTpye", "page1");
		initPage1();
	} else if (
		~currentPath.indexOf(
			"/kmReviewMain.do?method=add&fdTemplateId=15e50fd690c9639363c45fa4d639f6f6"
		)
	) {
		// console.log("===当前页面是[加班申请页]===");
		saveToStorageSync("currentPathTpye", "page2");
		initPage2();
	} else {
		// 在其他页时依然显示数据
		saveToStorageSync("currentPathTpye", "pageOther");

		// initPage1();
	}
};

/**
 * 插件每次初始化时，判断local的数据日期是否是今天。如果是之前的数据，则清除显示
 */
async function isTodayData() {
	const td_date = await getFromStorageSync("td_date");

	if (td_date) {
		const today = formatDate(new Date(), "yyyyMMdd");
		if (td_date !== today) {
			clearData();
		}
	}
}

/**
 * 向content-script发送消息
 */
function sendMsgToContentScript(data) {
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id, data, function (response) {
			// window.close();	// 关闭popup弹窗
		});
	});
}
/**
 * 注意, 应该要弹窗点开以后才能获取到, 弹窗点开之前发送的消息无法收到
 */
function receiveMsg() {
	chrome.runtime.onMessage.addListener(function (data, sender, sendResponse) {
		console.log("popup receiveMsg data: ", data);
	});
}

// 全局变量
const popupGlobal = {
	isWeekendCheckBoxChecked: false, // 是否勾选周末加班
	isJiucanCountTypeCheckBoxChecked: false, // 是否勾选就餐类型减半个钟
};

window.onload = async function () {
	console.log("popup onload");

	receiveMsg();
	registerEvent();
	initSettings();

	setToday();
	setWeekIcon();

	if (await checkHasInitPage1()) {
		// 已初始化过page1
		handleOvertimeListEle();
	}

	setVersion();
};

// 注册事件
function registerEvent() {
	$("#goToBtn1").on("click", gotoPage1);
	$(".to-get-msg").on("click", gotoPage1);
	$("#weekendCheckBox").on("change", weekendCheckBoxChange);
	$("#jiucanCountTypeCheckBox").on("change", jiucanCountTypeCheckBoxChange);
	$(".mealCheckBoxes").on("change", mealCheckBoxChange);

	// 监听选择加班类型
	$("input[type=radio][name=overtimeType]").change(function () {
		if ($(this).is(":checked")) {
			saveToStorageSync("settings_overtimeType", $(this).val());
		}

		// 刷新列表
		refreshList();
	});

	// 监听选择是否乘坐班车
	$("input[type=radio][name=takeBus]").change(function () {
		if ($(this).is(":checked")) {
			saveToStorageSync("settings_takeBus", $(this).val());
		}
	});

	$("#clearDataBtn").on("click", clearStorage);
}

// 注册设置
async function initSettings() {
	// 先恢复之前的设置显示
	let settings_overtimeType = await getFromStorageSync("settings_overtimeType");
	let settings_takeBus = await getFromStorageSync("settings_takeBus");
	// 选择加班类型: 直落: ZL(默认)   就餐: JC
	if (!settings_overtimeType || settings_overtimeType == "overtimeTypeZL") {
		// 选中直落
		$("#overtimeTypeZL").click();
	} else {
		$("#overtimeTypeJC").click();
	}
	// 选择是否乘坐班车:  是: value=1  否: value=2(默认)
	if (!settings_takeBus || settings_takeBus == "takeBusFalse") {
		$("#takeBusFalse").click();
	} else {
		$("#takeBusTrue").click();
	}

	// 就餐类型
	let settings_mealCheckBox = await getFromStorageSync("settings_mealCheckBox");
	// 首次使用，初始化就餐类型
	if (!settings_mealCheckBox) {
		settings_mealCheckBox = {
			box1: false,
			box2: false,
			box3: false,
			box4: false,
		};
		saveToStorageSync("settings_mealCheckBox", settings_mealCheckBox);
	}
	$("#mealCheckBox1").prop("checked", settings_mealCheckBox.box1);
	$("#mealCheckBox2").prop("checked", settings_mealCheckBox.box2);
	$("#mealCheckBox3").prop("checked", settings_mealCheckBox.box3);
	$("#mealCheckBox4").prop("checked", settings_mealCheckBox.box4);

	// 设置周末加班复选框
	// 周六或周日，自动勾选。（没有考虑节假日调休）
	if (new Date().getDay() == 6 || new Date().getDay() == 0) {
		$("#weekendCheckBox input").prop("checked", true);
		// 首次设置weekendCheckBox时不刷新列表（在下面执行jiucanCountTypeCheckBoxChange时会刷新列表）
		weekendCheckBoxChange({ donotFresh: true });
	} else {
		$("#weekendCheckBox input").prop("checked", false);
		// 首次设置weekendCheckBox时不刷新列表（在下面执行jiucanCountTypeCheckBoxChange时会刷新列表）
		weekendCheckBoxChange({ donotFresh: true });
	}

	// 设置就餐类型减半个钟复选框（恢复上次的选择，默认不勾选）
	let jiucanCountTypeCheckBox = await getFromStorageSync("jiucanCountTypeCheckBox");
	if (jiucanCountTypeCheckBox == undefined) {
		$("#jiucanCountTypeCheckBox").prop("checked", false);
		jiucanCountTypeCheckBoxChange();
	} else {
		$("#jiucanCountTypeCheckBox").prop("checked", jiucanCountTypeCheckBox);
		jiucanCountTypeCheckBoxChange();
	}

	// 如果今天有选择过
	let overTimeCotent = await getFromStorageSync("settings_overTimeCotent");
	// 历史加班内容
	let overTimeCotentHistory = await getFromStorageSync("overTimeCotentHistory");

	const overTimeContentListEle = $("#overTimeContentList");
	if (overTimeCotentHistory?.length > 0) {
		overTimeCotentHistory.forEach((item) => {
			if (overTimeCotent && item == overTimeCotent) {
				// 如果是今天选中过的，就加上选中样式
				overTimeContentListEle.append(
					`<div class="overtime-content-list-item __actived" title="${item}">${item}</div>`
				);
			} else {
				// 未选中的
				overTimeContentListEle.append(
					`<div class="overtime-content-list-item" title="${item}">${item}</div>`
				);
			}
		});

		// 点击选择事件。再次点击取消选择
		overTimeContentListEle.on("click", ".overtime-content-list-item", function () {
			$(this).toggleClass("__actived");
			// 如果是选中状态，其他的取消选中
			if ($(this).hasClass("__actived")) {
				$(this).siblings().removeClass("__actived");
				saveToStorageSync("settings_overTimeCotent", $(this).text());
			} else {
				// 取消选中，需要清除缓存
				removeFromStorageSync("settings_overTimeCotent");
			}
		});
	} else {
		overTimeContentListEle.append(`<div style="margin: 10px 0;color: #adadad">暂无历史记录</div>`);
	}
}

// 去考勤查询页
function gotoPage1() {
	// window.open(
	// 	"https://oa.desaysv.com/km/reviewex/km_reviewex_main/kmReviewexMain.do?method=attendanceList",
	// 	"_blank"
	// );
	chrome.tabs.create({
		url: "https://oa.desaysv.com/km/reviewex/km_reviewex_main/kmReviewexMain.do?method=attendanceList",
	});
}
// 跳转到加班申请页
function gotoPage2() {
	// sendMsgToContentScript({ type: "gotoPage2" });
	window.open(
		"https://oa.desaysv.com/km/review/km_review_main/kmReviewMain.do?method=add&fdTemplateId=15e50fd690c9639363c45fa4d639f6f6",
		"_blank"
	);
}

/**
 * 周末加班复选框点击事件
 */
async function weekendCheckBoxChange(options) {
	popupGlobal.isWeekendCheckBoxChecked = $("#weekendCheckBox input").prop("checked");
	saveToStorageSync("settings_isWeekendCheckBoxChecked", popupGlobal.isWeekendCheckBoxChecked);

	// 周末加班时就餐类型不可选择
	if (popupGlobal.isWeekendCheckBoxChecked) {
		$("#overtimeTypeZL").prop("disabled", true);
		$("#overtimeTypeJC").prop("disabled", true);
		$("#jiucanCountTypeCheckBox").prop("disabled", true);
	} else {
		$("#overtimeTypeZL").prop("disabled", false);
		$("#overtimeTypeJC").prop("disabled", false);
		$("#jiucanCountTypeCheckBox").prop("disabled", false);
	}

	!options.donotFresh && refreshList();
}

/**
 * 就餐类型减半个钟复选框点击事件
 */
async function jiucanCountTypeCheckBoxChange() {
	popupGlobal.isJiucanCountTypeCheckBoxChecked = $("#jiucanCountTypeCheckBox").prop("checked");
	saveToStorageSync("jiucanCountTypeCheckBox", popupGlobal.isJiucanCountTypeCheckBoxChecked);

	refreshList();
}

/**
 * 就餐复选框点击事件
 */
function mealCheckBoxChange() {
	let mealCheckBox = {
		box1: $("#mealCheckBox1").prop("checked"),
		box2: $("#mealCheckBox2").prop("checked"),
		box3: $("#mealCheckBox3").prop("checked"),
		box4: $("#mealCheckBox4").prop("checked"),
	};

	saveToStorageSync("settings_mealCheckBox", mealCheckBox);
}

/**
 * 根据initPage1的状态, 显示不同的内容
 * @returns {Promise<boolean>} 是否已初始化。true: 已初始化; false: 未初始化
 */
function checkHasInitPage1() {
	return new Promise(async (resolve, reject) => {
		let hasInitPage1 = await getFromStorageSync("hasInitPage1");

		if (!hasInitPage1) {
			// 未初始化
			$("#no-init-hide").hide();
			$("#no-init-show").show();
			// 隐藏清除缓存按钮
			$("#clearData").hide();

			$("body").css("width", "400px");
			$("html").css("height", "180px");

			resolve(false);
		} else {
			$("#no-init-hide").show();
			$("#no-init-show").hide();
			// 显示清除缓存按钮
			$("#clearData").show();

			// 不出现滚动条的最大宽度
			setTimeout(() => {
				$("body").css("width", "790px");
				$("html").css("height", "auto");
			}, 30);

			resolve(true);
		}
	});
}

/**
 * 刷新列表
 */
function refreshList() {
	// 防抖，防止短时间内连续多次渲染
	debounce(
		() => {
			_go();
		},
		100,
		false
	);

	async function _go() {
		let clockIn = await getFromStorageSync("td_clockIn");
		let clockOut = await getFromStorageSync("clockOut");
		let settings_overtimeType = await getFromStorageSync("settings_overtimeType");

		// 重新计算加班预览列表
		calculateOvertimeList({
			clockIn,
			clockOut,
			isWeekend: popupGlobal.isWeekendCheckBoxChecked,
			// 同时勾选时才触发减半个钟计算
			isJiucanMinus30:
				settings_overtimeType === "overtimeTypeJC" && popupGlobal.isJiucanCountTypeCheckBoxChecked,
		});
		// 刷新列表数据
		handleOvertimeListEle();
	}
}

/**
 * 构建加班预览列表
 */
async function handleOvertimeListEle() {
	//
	let clockIn = await getFromStorageSync("td_clockIn");
	let clockOut = await getFromStorageSync("clockOut");
	let overtimeList = await getFromStorageSync("overtimeList");

	if (!clockIn || !clockOut || !overtimeList) {
		// 无数据
		$("#no-data-msg").show();
		$("#has-data-div").hide();
		//
		$("body").css("width", "400px");
		$("html").css("height", "180px");
		return;
	} else {
		// 有数据
		$("#no-data-msg").hide();
		$("#has-data-div").show();
		$("#clock-in").text(clockIn);
		$("#clock-out").text(clockOut);

		if ($("#weekendCheckBox input").prop("checked")) {
			$("#clock-out").text("——");
		} else {
			$("#clock-out").text(clockOut);
		}
	}

	// 为了变成竖向排列,做一下处理
	let showList = [];
	let step1, step2;
	if (popupGlobal.isWeekendCheckBoxChecked) {
		step1 = 6;
		step2 = 10;
	} else {
		step1 = 3;
		step2 = 6;
	}
	let len = overtimeList.length;
	let leftIndex = 0;
	let rightIndex = Math.ceil(len / 2);
	for (let i = 0; i < len; i++) {
		// 区分按钮颜色
		if (overtimeList[i].overtime <= step1) {
			overtimeList[i].className = "green";
		} else if (overtimeList[i].overtime <= step2) {
			overtimeList[i].className = "yellow";
		} else {
			overtimeList[i].className = "red";
		}

		if (i % 2 == 0) {
			showList.push(overtimeList[leftIndex]);
			leftIndex += 1;
		}
		if (i % 2 == 1) {
			showList.push(overtimeList[rightIndex]);
			rightIndex += 1;
		}
	}

	const overtimeListEle = $("#overtime-list");
	// 需要先删除之前的列表
	overtimeListEle.children().remove();

	showList.forEach((item) => {
		overtimeListEle.append(
			`<div class="btn btn2 overtime-list-item ${item.className}" >
				<div class="btn-inner">
					<span class='time-txt'>${item.time} </span><span class='right-arrow-icon'></span>加班<span class='overtime-txt'>${item.overtime}</span>小时
					<i class="fa fa-right"></i>
				</div>
				<div class="btnbg-x"></div>
			</div>`
		);
	});

	// 创建点击事件
	$(".overtime-list-item").on("click", function () {
		// 获取子元素内容
		let time = $(this).find(".time-txt").text();
		let overtime = $(this).find(".overtime-txt").text();

		saveToStorageSync("selectData", { time, overtime });

		gotoPage2();
	});
}

/**
 * 获取今天的日期
 * @returns {String} 2023年1月1日 星期一
 */
function setToday() {
	let date = new Date();
	let year = date.getFullYear();
	let month = date.getMonth() + 1;
	let day = date.getDate();
	let week = date.getDay();

	let weekStr = "";
	switch (week) {
		case 0:
			weekStr = "星期日";
			break;
		case 1:
			weekStr = "星期一";
			break;
		case 2:
			weekStr = "星期二";
			break;
		case 3:
			weekStr = "星期三";
			break;
		case 4:
			weekStr = "星期四";
			break;
		case 5:
			weekStr = "星期五";
			break;
		case 6:
			weekStr = "星期六";
			break;
	}

	// let today = year + "年" + month + "月" + day + "日 " + weekStr;
	let today = `${month}月${day}日 ${weekStr} <span style='color:#adadad'>Week${getWeekOfYear()}</span>`;

	$(".todayTxt")[0].innerHTML = today;
	$(".todayTxt")[1].innerHTML = today;
	$(".todayTxt")[2].innerHTML = today;

	return today;
}

/**
 * 设置weekIcon
 */
function setWeekIcon() {
	let weekIconEle = $(".week-icon");
	let week = new Date().getDay();

	if (week == 6 || week == 0) {
		// 周六周日
		weekIconEle.attr("src", "../icons/-scared.png");
	} else if (week == 1) {
		// 周一
		weekIconEle.attr("src", "../icons/-sleeping.png");
	} else if (week == 2) {
		// 周二
		weekIconEle.attr("src", "../icons/-dizzy.png");
	} else if (week == 3) {
		// 周三
		weekIconEle.attr("src", "../icons/-neutral.png");
	} else if (week == 4) {
		// 周三
		weekIconEle.attr("src", "../icons/-smile.png");
	} else if (week == 5) {
		// 周三
		weekIconEle.attr("src", "../icons/-happy.png");
	}
}

/**
 * 从menifest.json中获取版本号
 */
function setVersion() {
	const version = chrome.runtime.getManifest().version;

	$("#version").text(`v${version}`);
}

/**
 * 清除全部storage数据
 */
function clearStorage() {
	clearAllStorage();

	window.close(); // 关闭popup弹窗
}

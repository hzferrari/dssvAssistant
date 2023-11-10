let clockIn;
let clockOut;
let overtimeList;
let selectData;

// 加班申请页 初始化
async function initPage2() {
	registerSubmit();

	// 获取数据
	clockIn = await getFromStorageSync("td_clockIn");
	clockOut = await getFromStorageSync("clockOut");
	overtimeList = await getFromStorageSync("overtimeList");

	selectData = await getFromStorageSync("selectData");

	if (!clockIn || !clockOut || !overtimeList) {
		// 无数据
		return;
	}

	insertDom();
}

/**
 * 插入内容
 */
async function insertDom() {
	if (clockIn && clockOut && selectData) {
		let settings_isWeekendCheckBoxChecked = await getFromStorageSync(
			"settings_isWeekendCheckBoxChecked"
		);

		let startTime;
		if (settings_isWeekendCheckBoxChecked) {
			// 周末加班
			startTime = clockIn;
		} else {
			startTime = clockOut;
		}

		let txt = `${startTime}-${selectData.time}`;

		$(".inputsgl.xform_inputText")[0].value = txt;
		$(".inputsgl.xform_inputText")[1].value = selectData.overtime;

		// 设定集
		let settings_overtimeType = await getFromStorageSync("settings_overtimeType");
		let settings_takeBus = await getFromStorageSync("settings_takeBus");
		let settings_mealCheckBox = await getFromStorageSync("settings_mealCheckBox");
		let overTimeCotent = await getFromStorageSync("settings_overTimeCotent");

		let overtimeTypeVal;
		let takeBusVal;

		// 选择加班类型: 直落: ZL(默认)   就餐: JC
		if (!settings_overtimeType || settings_overtimeType == "overtimeTypeZL") {
			overtimeTypeVal = "ZL";
		} else {
			overtimeTypeVal = "JC";
		}
		// 选择是否乘坐班车:  是: value=1  否: value=2(默认)
		if (!settings_takeBus || settings_takeBus == "takeBusFalse") {
			takeBusVal = "2";
		} else {
			takeBusVal = "1";
		}

		setTimeout(() => {
			// （周末时不填写就餐类型）
			if (!settings_isWeekendCheckBoxChecked) {
				$(".select_div_box.xform_Select")[1].value = overtimeTypeVal;
			}
			$(`input:radio[title=是否乘坐班车][value=${takeBusVal}]`).click();
			// 餐饮类型
			if (settings_mealCheckBox.box1) {
				$("[flagid=fd_catering_type]").find("input")[0].click();
			}
			if (settings_mealCheckBox.box2) {
				$("[flagid=fd_catering_type]").find("input")[1].click();
			}
			if (settings_mealCheckBox.box3) {
				$("[flagid=fd_catering_type]").find("input")[2].click();
			}
			if (settings_mealCheckBox.box4) {
				$("[flagid=fd_catering_type]").find("input")[3].click();
			}
			// 加班内容
			if (overTimeCotent) {
				$(".xform_textArea[title='加班内容']")[0].value = overTimeCotent;
			}
		}, 500);
	}
}

/**
 * 监听提交按钮。记录历史加班内容
 */
function registerSubmit() {
	console.log("registerSubmit2 ");

	$(".lui-component.lui_widget_btn[title='提交']").on("click", async function () {
		let overTimeCotentHistory = await getFromStorageSync("overTimeCotentHistory");

		if (!overTimeCotentHistory) {
			overTimeCotentHistory = [];
		}

		let overTimeContent = $(".xform_textArea[title='加班内容']")[0].value;

		// 如果内容跟历史的都不一样，则记录
		if (!overTimeCotentHistory.includes(overTimeContent)) {
			overTimeCotentHistory.unshift(overTimeContent);
			// 最多记录3条历史
			if (overTimeCotentHistory.length > 3) {
				overTimeCotentHistory.pop();
			}
			saveToStorageSync("overTimeCotentHistory", overTimeCotentHistory);
		} else {
			// 重复的内容，移到第一条
			let index = overTimeCotentHistory.indexOf(overTimeContent);
			overTimeCotentHistory.splice(index, 1);
			overTimeCotentHistory.unshift(overTimeContent);
			saveToStorageSync("overTimeCotentHistory", overTimeCotentHistory);
		}
	});
}

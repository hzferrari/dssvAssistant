/**
 * 时间格式转换，支持时间戳、Date对象、字符串等格式
 * @param {Date|Timestamp(Number)|String} date 兼容Date对象、时间戳、类似"2022-10-31 14:45:26"字符串格式
 * @param {String} fmt 'yyyy-MM-dd' ,'MM-dd'等格式
 * @returns
 *
 */
function formatDate(date, fmt) {
	date = handleFormatDate(date);
	if (!date) return;

	fmt = fmt ? fmt : "yyyy-MM-dd hh:mm:ss";
	if (/(y+)/.test(fmt)) {
		fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").slice(4 - RegExp.$1.length));
	}
	var o = {
		"M+": date.getMonth() + 1, // 月
		"d+": date.getDate(), //日
		"h+": date.getHours(), //小时
		"m+": date.getMinutes(), //分
		"s+": date.getSeconds(), //秒
	};
	for (var k in o) {
		if (new RegExp(`(${k})`).test(fmt)) {
			var str = o[k] + "";
			fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? str : padLeftZero(str));
		}
	}
	return fmt;
}
function padLeftZero(str) {
	return ("00" + str).slice(str.length);
}
function handleFormatDate(date) {
	// 兼容Date对象、时间戳、类似"2022-10-31 14:45:26"字符串格式
	let res;
	if (typeof date === "object") {
		res = date;
	} else if (typeof date === "number") {
		// number格式的时间戳
		res = new Date(date);
	} else if (typeof date === "string") {
		if (Number(date) && !isNaN(Number(date))) {
			// 兼容string格式的时间戳
			res = new Date(Number(date));
		} else {
			// 兼容"2022-10-31 14:45:26"字符串格式
			// ! IOS有时间格式的问题，必须是YYYY/MM/DD HH:MM:SS 或者 YYYY-MM-DDTHH:MM:SS格式的字符串才能new Date()。如“2020/01/01”这种也不行，这里做一个报错提示。
			if (isNaN(new Date(date))) {
				console.error(
					"IOS中，传入的的字符串类型的日期格式应为YYYY/MM/DD HH:MM:SS 或者 YYYY-MM-DDTHH:MM:SS"
				);
				return false;
			} else {
				res = new Date(date);
			}
		}
	}
	return res;
}

/**
 * 时间相加计算
 */
function addTime(time1, time2) {
	if (!time1 || !time2) return;

	let [h1, m1] = time1.split(":");
	let [h2, m2] = time2.split(":");
	let h = parseInt(h1) + parseInt(h2);
	let m = parseInt(m1) + parseInt(m2);
	if (m >= 60) {
		m -= 60;
		h += 1;
	}

	// 补0. 返回形如 08:00
	return `${padLeftZero(String(h))}:${padLeftZero(String(m))}`;
}

/**
 * 比较两个时间哪个早(注意入参是24小时制)
 * @param {String} time1
 * @param {String} time2
 * @returns {Number} -1: time1早; 1: time2早 ; 0: 一样
 * @example
 * compareTime("07:30", "08:30"); // -1
 * compareTime("08:30", "07:30"); // 1
 * compareTime("08:30", "08:30"); // 0
 */
function compareTime(time1, time2) {
	if (!time1 || !time2) return;

	let [h1, m1] = time1.split(":");
	let [h2, m2] = time2.split(":");
	h1 = parseInt(h1);
	h2 = parseInt(h2);
	m1 = parseInt(m1);
	m2 = parseInt(m2);

	if (h1 < h2) {
		return -1;
	} else if (h1 > h2) {
		return 1;
	} else {
		if (m1 < m2) {
			return -1;
		} else if (m1 > m2) {
			return 1;
		} else {
			return 0;
		}
	}
}

/**
 * 计算某日期是今年第几周，默认今天
 * @param {Date} date
 * @returns {Number} 1-53
 * @example getWeekOfYear(); // 42
 */
function getWeekOfYear(date = new Date()) {
	let dayFirst = new Date(date.getFullYear(), 0, 1); // 今年的1月1日
	let dayEnd = date;
	let dayCount = Math.ceil((dayEnd - dayFirst) / (24 * 60 * 60 * 1000)); // 今天是今年的第几天

	// 计算几天内是第几周的方式：
	// 比如2021年1月1日是周五，那么2021年1月1日到1月2日是第1周，1月3日到1月9日是第2周（周日是第一天），以此类推。
	let spand = dayFirst.getDay(); // 今年的1月1日是周几 0-6，0是周日
	let weekCount = Math.ceil((dayCount + spand) / 7); // 今天是今年的第几周

	return weekCount;
}

function analyze(){

let price = Number(document.getElementById("price").value);
let jeonse = Number(document.getElementById("jeonse").value);
let rent = Number(document.getElementById("rent").value);
let area = Number(document.getElementById("area").value);

if(price<=0 || area<=0){
    alert("매매가와 면적을 입력하세요.");
    return;
}

let gap = price - jeonse;

let per = (price/area).toFixed(1);

let opinion="";
let cls="";

if(gap<=5000){
    opinion="매우 좋은 갭투자 매물";
    cls="good";
}
else if(gap<=15000){
    opinion="평균 수준의 투자";
    cls="normal";
}
else{
    opinion="초기 투자금이 큰 편";
    cls="bad";
}

let rentText="없음";

if(rent>0){
    rentText=rent+"만원";
}

document.getElementById("result").innerHTML=`

<h2>📊 분석 결과</h2>

<p><b>매매가</b> : ${price.toLocaleString()} 만원</p>

<p><b>전세가</b> : ${jeonse.toLocaleString()} 만원</p>

<p><b>월세</b> : ${rentText}</p>

<p><b>갭 투자금</b> : ${gap.toLocaleString()} 만원</p>

<p><b>㎡당 가격</b> : ${per} 만원</p>

<p class="${cls}">${opinion}</p>

`;

}

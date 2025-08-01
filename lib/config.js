//
// 요소 ID
export const USER_OPTIONS      = ["url", "param", "delay", "useCookies"]; // 사용자 입력 요소 ID
export const SCAN_VAL          = ["test-param"];
export const ERROR_BANNER      = "errorBanner";               // 에러 출력 요소 ID
export const SIGN              = "user_option";               // html 요소 식별 마커  
export const OBSERV_DATA       = "opservation";               // 

// 
// 테스트 표시 요소 
export const XSS_MARKER        = "Qw4pl0ui";                  // reflection  확인 문자열
export const XSS_INJECT_TARGET = "XSS_T";                     // 공격 파라미터 표시 문자열
export const START_CHUNCK      = "P0tOc";                     // 필터링 확인 시작 문자열
export const END_CHUNK         = "ZnFer";                     // 필터링 확인 끝 문자열 

//
// 용도별 메세지
export const START_MSG        = {status : "started"};         // 테스트 시작 응답 메세지
export const FILTER_CHECK     = "START_FILTER";               // 필터 체크 시작 메세지
export const REPLAY_CHECK     = "REPLAY_FILTER";              // 재스캔 메세지
export const ATTACK_START     = "START_ATTACK";               // 공격 시작 메세지
export const ERROR_MSG        = "ERROR";                      // 에러 메세지
export const HTML_CAPTURED    = "HTML_CAPTURED";              // 현재 url html 캡처 메세지
export const FILTER_RESULT    = "FILTER_RESULT_MSG";          // 필터링 결과 메세지
export const FILTER_DATA      = "ft-msg";                     // 필터링 데이터 msg
export const ATTACK_RESULT    = "ATTACK_RESULT_MSG";          // 공격 결과 메세지
export const ATTACK_DATA      = "atk-msg";                    // 공격 데이터 msg
export const mov_popup2       = "GO_TO_POPUP2";               // popup2 이동 메세지
export const mov_result       = "GO_TO_RESULT";               // popup3 이동 메세지

//
// 자바스크립트 추출 표현식 
export const JAVASCRIPT_REGEXP = /<script[^>]*>([\s\S]*?)<\/script>/gi;
export const VULN_REGEXP       = /Vulnerable/

export const ABNORMAL_START    = "abnormal_start";
export const ABNORMAL_END      = "abnormal_end";

export const OPTION_KEYS = {
    "url"           : "url"    , 
    "target_params" : "param"  ,
    "delay"         : "delay",
    "cookie"        : "useCookies"
}

export const VOID_TAGS = [
    "area", "base", "br", "col", "embed", "hr","img", 
    "input", "link", "meta", "source","track", "wbr"
];

export const REQUEST_ATTRIBUTES = ([
  "href", "src", "action", "formaction", 
  "data", "poster", "xlink:href"   
]);
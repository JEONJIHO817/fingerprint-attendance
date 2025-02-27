# 지문인식 기반 근로장학생 출근부 시스템 (AWS 활용)

## 프로젝트 개요
이 프로젝트는 클라우드 컴퓨팅 수업의 일환으로 AWS를 활용하여 근로장학생 출근부 시스템을 구축한 내용입니다. 사용자는 지문을 등록하고 이를 통해 출퇴근을 기록할 수 있으며, 관리자는 출근부를 확인하고 수정할 수 있습니다.

## 기존 출근 시스템의 문제점
1. **부정 근로 문제**
   - 2015~2018년 국가근로장학금 정기 점검 결과, **총 5,569건의 부정근로**가 적발됨
   - 대리 근로, 허위 근로 등의 문제 발생

2. **위치 기반 서비스에 대한 불만**
   - 기존 GPS 기반 출근부 시스템의 오류 문제 발생
   - 학생 인권 침해 우려로 인해 반발이 있음

3. **출근부 작성의 번거로움**
   - 기존 시스템에서는 출근부 어플리케이션 외에도 **수기로 서명**해야 하는 번거로움 존재
   - 실시간 출근부 확인 및 수정 기능 부족

## 주요 기능
- **사용자 인증**: AWS Cognito를 활용한 사용자 로그인 및 이메일 인증
- **지문 등록 및 비교**: SourceAFIS를 활용한 지문 인식 및 본인 인증
- **출퇴근 기록 관리**: DynamoDB를 이용한 출퇴근 데이터 저장 및 조회
- **웹 인터페이스**: AWS 정적 호스팅을 활용한 웹 프론트엔드 구축
- **서버리스 아키텍처**: AWS Lambda와 API Gateway를 이용한 요청 처리
- **관리자 기능**: 관리자 계정 승인, 출근부 수정 및 근로장학생 관리

## 기술 스택
- **프론트엔드**: AWS 정적 호스팅 (S3)
- **백엔드**: AWS Lambda, API Gateway, Flask
- **데이터베이스**: Amazon DynamoDB
- **지문 인식**: SourceAFIS

## 시스템 아키텍처
1. 사용자는 웹 애플리케이션을 통해 회원가입 후 이메일 인증을 완료합니다.
2. 관리자는 승인된 근로장학생의 지문을 등록합니다.
3. 출근 또는 퇴근 시 지문을 스캔하여 본인 인증 후 출퇴근 시간을 기록합니다.
4. 기록된 데이터는 DynamoDB에 저장되며, 관리자는 실시간으로 조회할 수 있습니다.
5. AWS Lambda를 활용하여 지문 데이터를 처리하고 API Gateway를 통해 프론트엔드와 연동합니다.

### SourceAFIS 지문 인식 성능
- **동일인 지문 인식 성능**: 95% 이상
- **타인 지문 거부 정확도**: 99% 이상
- **특징점 기반 지문 일치도 반환**
- 출처: [SourceAFIS 공식 홈페이지](https://sourceafis.machinezoo.com/)

## 기대 효과
- **부정 근로 방지**: 지문 인식을 통한 본인 인증으로 대리 출퇴근 방지
- **운영 효율성 증가**: 자동화된 출퇴근 기록으로 관리자의 업무 부담 감소
- **확장 가능성**: AWS 기반으로 대규모 조직 및 다른 분야로의 확장 가능

## 향후 계획
- **지문 데이터 보안 강화**: AES-256 암호화를 통한 안전한 저장
- **관리자 승인 기능 개선**: 이메일 인증 후 관리자 추가 승인 필요
- **위치 기반 기능 추가**: 지정된 IP 대역 또는 국가에서만 로그인 가능하도록 제한
- **모바일 앱 연동**: 근로장학생이 스마트폰을 통해 출퇴근을 기록할 수 있도록 지원

## 팀원 소개
- **전지호**: 프로젝트 팀장, 시스템 설계 및 관리
- **윤재영**: SourceAFIS 구현 및 지문 인식 기능 개발
- **오유림**: 프론트엔드 개발 및 웹 인터페이스 구축

##참고 프로젝트
- 서버리스 아키텍처: [https://github.com/Dbhardwaj99/wildrydes-site.git]

## 라이선스
본 프로젝트는 교육 목적의 실습 프로젝트로, 상업적 이용은 제한될 수 있습니다.

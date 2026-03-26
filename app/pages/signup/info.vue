<script setup>
import signupData from "~/data/signup.json";
import {
  validate,
  validateRequired,
  validatePasswordConfirm,
} from "~/utils/validators";

useHead({ title: signupData.info.seo.title });
useSeoMeta({
  title: signupData.info.seo.title,
  description: signupData.info.seo.description,
});

const router = useRouter();
const signupStore = useSignupStore();
const { post, patch } = useApi();
const { openPostcode } = usePostcode();

// 이메일 인증 상태
const emailVerification = reactive({
  isCodeSent: false,
  isVerified: false,
  code: "",
  token: "",
  message: "",
  isError: false,
});

// 소셜 계정 존재 안내 모달 (AUTH_018)
const showSocialExistModal = ref(false);
const socialExistProvider = ref("");

// 인증코드 발송
const sendVerificationCode = async () => {
  if (!validateRequired(form.email)) {
    alert(signupData.info.messages.emailRequired);
    return;
  }
  if (!validate("email", form.email)) {
    alert(signupData.info.messages.emailInvalid);
    return;
  }

  try {
    await post("/auth/email-verifications", { email: form.email });
    emailVerification.isCodeSent = true;
    emailVerification.message = signupData.info.messages.codeSent;
    emailVerification.isError = false;
  } catch (error) {
    if (error.data?.error?.code === "AUTH_018") {
      socialExistProvider.value = error.data?.data?.provider || "";
      showSocialExistModal.value = true;
      emailVerification.message = "";
      return;
    }
    emailVerification.message =
      error.data?.message || signupData.info.messages.codeSendFailed;
    emailVerification.isError = true;
  }
};

// 인증코드 확인
const verifyCode = async () => {
  if (!validateRequired(emailVerification.code)) {
    alert(signupData.info.messages.codeRequired);
    return;
  }

  try {
    const result = await patch("/auth/email-verifications", {
      email: form.email,
      code: emailVerification.code,
    });
    emailVerification.isVerified = true;
    emailVerification.token = result.data.verificationToken;
    emailVerification.message = signupData.info.messages.codeVerified;
    emailVerification.isError = false;
  } catch (error) {
    emailVerification.message =
      error.data?.message || signupData.info.messages.codeVerifyFailed;
    emailVerification.isError = true;
  }
};

// 약관 동의 미완료 시 리다이렉트
onMounted(() => {
  if (!signupStore.canAccessInfo) {
    router.replace("/signup/terms");
  }
});

const currentStepIndex = 1;

const form = reactive({
  email: "",
  password: "",
  passwordConfirm: "",
  name: "",
  mobilePrefix: "010",
  mobile1: "",
  mobile2: "",
  postalCode: "",
  address1: "",
  address2: "",
  gender: "MALE",
  birthYear: "",
  birthMonth: "",
  birthDay: "",
});

// 우편번호 검색
const searchZip = async () => {
  const result = await openPostcode();
  form.postalCode = result.zonecode;
  form.address1 = result.address;
};

// 휴대폰 번호 합치기
const getPhone = () => {
  return `${form.mobilePrefix}${form.mobile1}${form.mobile2}`;
};

// 생년월일 합치기 (YYYY-MM-DD)
const getBirthDate = () => {
  if (!form.birthYear || !form.birthMonth || !form.birthDay) return "";
  const month = form.birthMonth.toString().padStart(2, "0");
  const day = form.birthDay.toString().padStart(2, "0");
  return `${form.birthYear}-${month}-${day}`;
};

// 생년월일 옵션 생성
const currentYear = new Date().getFullYear();
const birthYearOptions = Array.from({ length: 100 }, (_, i) => {
  const year = currentYear - i;
  return { label: `${year}`, value: `${year}` };
});
const birthMonthOptions = Array.from({ length: 12 }, (_, i) => {
  const month = i + 1;
  return { label: `${month}`, value: `${month}` };
});
const birthDayOptions = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  return { label: `${day}`, value: `${day}` };
});

// 폼 검증
const validateForm = () => {
  if (!validateRequired(form.email)) {
    alert(signupData.info.messages.emailRequired);
    return false;
  }
  if (!validate("email", form.email)) {
    alert(signupData.info.messages.emailInvalid);
    return false;
  }
  // if (!emailVerification.isVerified) {
  //   alert(signupData.info.messages.emailNotVerified);
  //   return false;
  // }
  if (!validateRequired(form.password)) {
    alert(signupData.info.messages.passwordRequired);
    return false;
  }
  if (!validate("password", form.password)) {
    alert(signupData.info.messages.passwordInvalid);
    return false;
  }
  if (!validatePasswordConfirm(form.password, form.passwordConfirm)) {
    alert(signupData.info.messages.passwordMismatch);
    return false;
  }
  if (!validateRequired(form.name)) {
    alert(signupData.info.messages.nameRequired);
    return false;
  }
  if (!validate("name", form.name)) {
    alert(signupData.info.messages.nameInvalid);
    return false;
  }
  if (!validateRequired(form.mobile1) || !validateRequired(form.mobile2)) {
    alert(signupData.info.messages.phoneRequired);
    return false;
  }
  if (!validate("phoneMid", form.mobile1)) {
    alert(signupData.info.messages.phoneMidInvalid);
    return false;
  }
  if (!validate("phoneLast", form.mobile2)) {
    alert(signupData.info.messages.phoneLastInvalid);
    return false;
  }
  return true;
};

const handleComplete = async () => {
  if (!validateForm()) return;

  try {
    const result = await post("/auth/signup", {
      email: form.email,
      password: form.password,
      passwordConfirm: form.passwordConfirm,
      name: form.name,
      phone: getPhone(),
      gender: form.gender,
      birthDate: getBirthDate(),
      postalCode: form.postalCode,
      address1: form.address1,
      address2: form.address2,
      verificationToken: emailVerification.token,
      agreements: signupStore.agreements,
    });

    if (result.success) {
      signupStore.completeSignup();
      router.push("/signup/done");
    }
  } catch (error) {
    alert(error.data?.message || signupData.info.messages.signupFailed);
  }
};
</script>

<template>
  <div class="page-signup-info">
    <main class="signup-info-page">
      <div class="signup-info-page__inner layout-1000">
        <div class="signup-info-page__header">
          <h1 class="signup-info-page__title">
            {{ signupData.common.pageTitle }}
          </h1>

          <ol
            class="signup-steps"
            :aria-label="signupData.common.stepsAriaLabel"
          >
            <li
              v-for="(s, idx) in signupData.common.steps"
              :key="s.value"
              class="signup-steps__item"
              :class="{
                'signup-steps__item--done': idx < currentStepIndex,
                'signup-steps__item--active': idx === currentStepIndex,
              }"
            >
              <span
                class="signup-steps__circle"
                :class="{
                  'signup-steps__circle--done': idx < currentStepIndex,
                  'signup-steps__circle--active': idx === currentStepIndex,
                }"
                aria-hidden="true"
              />
              <span class="signup-steps__label">{{ s.label }}</span>
            </li>
          </ol>
        </div>

        <div class="signup-info-sections">
          <!-- 회원정보(기본) -->
          <section class="signup-info-section">
            <header class="signup-info-section__head">
              <h2 class="signup-info-section__title">
                {{ signupData.info.sections.basic.title }}
              </h2>
              <p class="signup-info-section__required">
                {{ signupData.info.sections.basic.required }}
              </p>
            </header>

            <div class="signup-info-section__body">
              <!-- 이메일 (API: email) -->
              <div class="signup-info-row">
                <div class="signup-info-row__label">
                  {{ signupData.info.fields.email.label
                  }}<span class="signup-info-row__star">*</span>
                </div>
                <div class="signup-info-row__field">
                  <div class="signup-info-email-verify">
                    <div class="signup-info-email-verify__top">
                      <div class="signup-info-email-verify__input">
                        <BaseInput
                          v-model="form.email"
                          type="email"
                          :placeholder="
                            signupData.info.fields.email.placeholder
                          "
                          :required="true"
                          :disabled="emailVerification.isVerified"
                          autocomplete="email"
                        />
                      </div>
                      <!-- <BaseButton
                        type="button"
                        variant="bg"
                        color="green"
                        size="big"
                        class="signup-info-email-verify__btn"
                        :disabled="emailVerification.isVerified"
                        @click="sendVerificationCode"
                      >
                        {{ signupData.info.buttons.sendCode }}
                      </BaseButton> -->
                    </div>
                    <p
                      v-if="emailVerification.message"
                      class="signup-info-email-verify__message"
                      :class="{
                        'signup-info-email-verify__message--error':
                          emailVerification.isError,
                      }"
                    >
                      {{ emailVerification.message }}
                    </p>
                    <div
                      v-if="
                        emailVerification.isCodeSent &&
                        !emailVerification.isVerified
                      "
                      class="signup-info-email-verify__code"
                    >
                      <div class="signup-info-email-verify__code-input">
                        <BaseInput
                          v-model="emailVerification.code"
                          :placeholder="
                            signupData.info.fields.email.codePlaceholder
                          "
                          maxlength="6"
                        />
                      </div>
                      <BaseButton
                        type="button"
                        variant="bg"
                        color="black"
                        size="big"
                        class="signup-info-email-verify__code-btn"
                        @click="verifyCode"
                      >
                        {{ signupData.info.buttons.verifyCode }}
                      </BaseButton>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 비밀번호 (API: password) -->
              <div class="signup-info-row">
                <div class="signup-info-row__label">
                  {{ signupData.info.fields.password.label
                  }}<span class="signup-info-row__star">*</span>
                </div>
                <div class="signup-info-row__field">
                  <BaseInput
                    v-model="form.password"
                    type="password"
                    :placeholder="signupData.info.fields.password.placeholder"
                    :required="true"
                    autocomplete="new-password"
                  />
                  <p
                    class="signup-info-row__help signup-info-row__help--danger"
                  >
                    {{ signupData.info.fields.password.help }}
                  </p>
                </div>
              </div>

              <!-- 비밀번호 확인 (API: passwordConfirm) -->
              <div class="signup-info-row">
                <div class="signup-info-row__label">
                  {{ signupData.info.fields.passwordConfirm.label
                  }}<span class="signup-info-row__star">*</span>
                </div>
                <div class="signup-info-row__field">
                  <BaseInput
                    v-model="form.passwordConfirm"
                    type="password"
                    :placeholder="
                      signupData.info.fields.passwordConfirm.placeholder
                    "
                    :required="true"
                    autocomplete="new-password"
                  />
                </div>
              </div>

              <!-- 이름 (API: name) -->
              <div class="signup-info-row">
                <div class="signup-info-row__label">
                  {{ signupData.info.fields.name.label
                  }}<span class="signup-info-row__star">*</span>
                </div>
                <div class="signup-info-row__field">
                  <BaseInput
                    v-model="form.name"
                    :placeholder="signupData.info.fields.name.placeholder"
                    :required="true"
                    autocomplete="name"
                  />
                </div>
              </div>

              <!-- TODO: 유선전화 - API 미지원
              <div class="signup-info-row">
                <div class="signup-info-row__label">{{ signupData.info.fields.tel.label }}<span class="signup-info-row__star">*</span></div>
                <div class="signup-info-row__field signup-info-row__field--inline">
                  <div class="signup-info-split">
                    <div class="signup-info-split__w150">
                      <BaseSelect v-model="form.telArea" :options="signupData.info.options.telArea" placeholder="02" variant="box" />
                    </div>
                    <span class="signup-info-split__dash" aria-hidden="true" />
                    <div class="signup-info-split__w150">
                      <BaseInput v-model="form.tel1" type="tel" placeholder="" autocomplete="tel-national" />
                    </div>
                    <span class="signup-info-split__dash" aria-hidden="true" />
                    <div class="signup-info-split__w150">
                      <BaseInput v-model="form.tel2" type="tel" placeholder="" autocomplete="tel-national" />
                    </div>
                  </div>
                </div>
              </div>
              -->

              <!-- 휴대폰 (API: phone) -->
              <div class="signup-info-row">
                <div class="signup-info-row__label">
                  {{ signupData.info.fields.mobile.label
                  }}<span class="signup-info-row__star">*</span>
                </div>
                <div
                  class="signup-info-row__field signup-info-row__field--inline"
                >
                  <div class="signup-info-split">
                    <div class="signup-info-split__w150">
                      <BaseSelect
                        v-model="form.mobilePrefix"
                        :options="signupData.info.options.mobilePrefix"
                        placeholder="010"
                        variant="box"
                      />
                    </div>
                    <span class="signup-info-split__dash" aria-hidden="true" />
                    <div class="signup-info-split__w150">
                      <BaseInput
                        v-model="form.mobile1"
                        type="tel"
                        placeholder=""
                        autocomplete="tel-national"
                      />
                    </div>
                    <span class="signup-info-split__dash" aria-hidden="true" />
                    <div class="signup-info-split__w150">
                      <BaseInput
                        v-model="form.mobile2"
                        type="tel"
                        placeholder=""
                        autocomplete="tel-national"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- 주소 -->
              <div class="signup-info-row">
                <div class="signup-info-row__label">
                  {{ signupData.info.fields.address.label
                  }}<span class="signup-info-row__star">*</span>
                </div>
                <div class="signup-info-row__field">
                  <div class="signup-info-address">
                    <div class="signup-info-address__top">
                      <div class="signup-info-address__zip">
                        <BaseInput
                          v-model="form.postalCode"
                          :placeholder="
                            signupData.info.fields.address.placeholder
                          "
                          :readonly="true"
                        />
                      </div>
                      <BaseButton
                        type="button"
                        variant="bg"
                        color="green"
                        size="big"
                        class="signup-info-address__btn"
                        @click="searchZip"
                      >
                        {{ signupData.info.buttons.searchZip }}
                      </BaseButton>
                    </div>
                    <BaseInput
                      v-model="form.address1"
                      :placeholder="
                        signupData.info.fields.address.addressPlaceholder
                      "
                      :readonly="true"
                    />
                    <BaseInput
                      v-model="form.address2"
                      :placeholder="
                        signupData.info.fields.address.detailPlaceholder
                      "
                    />
                  </div>
                </div>
              </div>

              <!-- 성별 (API: gender - MALE/FEMALE) -->
              <div class="signup-info-row">
                <div class="signup-info-row__label">
                  {{ signupData.info.fields.gender.label
                  }}<span class="signup-info-row__star">*</span>
                </div>
                <div class="signup-info-row__field">
                  <BaseRadioGroup
                    v-model="form.gender"
                    :options="[
                      ...signupData.info.fields.gender.options,
                    ]"
                    name="gender"
                    variant="default"
                    :aria-label="signupData.info.fields.gender.label"
                  />
                </div>
              </div>

              <!-- 생년월일 (API: birthDate - YYYY-MM-DD) -->
              <div class="signup-info-row">
                <div class="signup-info-row__label">
                  {{ signupData.info.fields.birth.label }}
                </div>
                <div
                  class="signup-info-row__field signup-info-row__field--inline"
                >
                  <div class="signup-info-split">
                    <div class="signup-info-split__w150">
                      <BaseSelect
                        v-model="form.birthYear"
                        :options="birthYearOptions"
                        :placeholder="signupData.info.fields.birth.year"
                        variant="box"
                      />
                    </div>
                    <span class="signup-info-split__dash" aria-hidden="true" />
                    <div class="signup-info-split__w150">
                      <BaseSelect
                        v-model="form.birthMonth"
                        :options="birthMonthOptions"
                        :placeholder="signupData.info.fields.birth.month"
                        variant="box"
                      />
                    </div>
                    <span class="signup-info-split__dash" aria-hidden="true" />
                    <div class="signup-info-split__w150">
                      <BaseSelect
                        v-model="form.birthDay"
                        :options="birthDayOptions"
                        :placeholder="signupData.info.fields.birth.day"
                        variant="box"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="signup-info-actions">
          <BaseButton
            type="button"
            variant="bg"
            color="black"
            size="big"
            class="signup-info-actions__btn"
            @click="handleComplete"
          >
            {{ signupData.info.buttons.complete }}
          </BaseButton>
        </div>
      </div>
    </main>

    <!-- 소셜 계정 존재 안내 모달 -->
    <BaseModal
      v-model="showSocialExistModal"
      :title="signupData.info.socialExist.modalTitle"
      width="400px"
    >
      <div class="password-modal-form">
        <p class="password-modal-form__desc">
          {{ signupData.info.socialExist.messagePre }}{{ socialExistProvider
          }}{{ signupData.info.socialExist.messagePost }}
        </p>
      </div>

      <template #footer>
        <BaseButton
          type="button"
          variant="bg"
          color="green"
          size="small"
          @click="
            showSocialExistModal = false;
            router.push('/login');
          "
        >
          {{ signupData.info.socialExist.loginButton }}
        </BaseButton>
        <BaseButton
          type="button"
          variant="bg"
          color="light"
          size="small"
          @click="showSocialExistModal = false"
        >
          {{ signupData.info.socialExist.cancelButton }}
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

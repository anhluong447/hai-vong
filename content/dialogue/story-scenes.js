import {t} from '../../src/shared/text.js';

// Production dialogue script schemas for narrative arcs, investigation and dating/hangout events.
const line = (speaker, expression, text, next) => ({ speaker, expression, text, ...(next ? { next } : {}) });

export const STORY_SAMPLE_SCENES = {
  // Scene 1: Lục Thanh Vân Rank 4 - Bước ngoặt tình cảm tại Ngọn Hải Đăng Cổ Hải Vọng
  van_hangout_rank4: {
    title: t("content.dialogue.story.van_hangout_rank4.title"),
    nodes: {
      start: line('van', 'neutral', t("content.dialogue.story.van_hangout_rank4.start"), 'wind'),
      wind: line('van', 'serious', t("content.dialogue.story.van_hangout_rank4.wind"), 'past'),
      past: line('van', 'serious', t("content.dialogue.story.van_hangout_rank4.past"), 'confession'),
      confession: line('van', 'happy', t("content.dialogue.story.van_hangout_rank4.confession"), 'decision'),
      decision: {
        ...line('van', 'serious', t("content.dialogue.story.van_hangout_rank4.decision")),
        choices: [
          { label: t("content.dialogue.story.van_hangout_rank4.choice_friendship"), next: 'friendship' },
          { label: t("content.dialogue.story.van_hangout_rank4.choice_romance"), next: 'romance' }
        ]
      },
      friendship: line('van', 'happy', t("content.dialogue.story.van_hangout_rank4.friendship_resp"), 'friendship_end'),
      friendship_end: line('khue', 'happy', t("content.dialogue.story.van_hangout_rank4.friendship_end")),
      romance: line('van', 'happy', t("content.dialogue.story.van_hangout_rank4.romance_resp"), 'romance_end'),
      romance_end: line('khue', 'happy', t("content.dialogue.story.van_hangout_rank4.romance_end"))
    }
  },

  // Scene 2: Điều tra Tuần 8 - Đối chất kịch tính với Thầy Giám thị / Ban Giám thị về Lệnh đình bản số báo 7
  investigation_confrontation_authority: {
    title: t("content.dialogue.story.investigation_confrontation_authority.title"),
    nodes: {
      start: line('teacher', 'neutral', t("content.dialogue.story.investigation_confrontation_authority.start"), 'demand'),
      demand: line('teacher', 'neutral', t("content.dialogue.story.investigation_confrontation_authority.demand"), 'van_defend'),
      van_defend: line('van', 'serious', t("content.dialogue.story.investigation_confrontation_authority.van_defend"), 'decision'),
      decision: {
        ...line('teacher', 'neutral', t("content.dialogue.story.investigation_confrontation_authority.decision")),
        choices: [
          { label: t("content.dialogue.story.investigation_confrontation_authority.choice_courage"), next: 'courage' },
          { label: t("content.dialogue.story.investigation_confrontation_authority.choice_strategy"), next: 'strategy' }
        ]
      },
      courage: line('khue', 'questioning', t("content.dialogue.story.investigation_confrontation_authority.courage_resp"), 'courage_reply'),
      courage_reply: line('teacher', 'neutral', t("content.dialogue.story.investigation_confrontation_authority.courage_end")),
      strategy: line('khue', 'investigate', t("content.dialogue.story.investigation_confrontation_authority.strategy_resp"), 'strategy_reply'),
      strategy_reply: line('teacher', 'neutral', t("content.dialogue.story.investigation_confrontation_authority.strategy_end"))
    }
  },

  // Scene 3: Đoàn Bảo Long Rank 3 - Quán ốc đêm Cảng cá Hải Vọng & Áp lực gia đình
  long_hangout_rank3: {
    title: t("content.dialogue.story.long_hangout_rank3.title"),
    nodes: {
      start: line('long', 'happy', t("content.dialogue.story.long_hangout_rank3.start"), 'chat'),
      chat: line('long', 'neutral', t("content.dialogue.story.long_hangout_rank3.chat"), 'burden'),
      burden: line('long', 'serious', t("content.dialogue.story.long_hangout_rank3.burden"), 'decision'),
      decision: {
        ...line('long', 'serious', t("content.dialogue.story.long_hangout_rank3.decision")),
        choices: [
          { label: t("content.dialogue.story.long_hangout_rank3.choice_support"), next: 'support' },
          { label: t("content.dialogue.story.long_hangout_rank3.choice_listen"), next: 'listen' }
        ]
      },
      support: line('khue', 'serious', t("content.dialogue.story.long_hangout_rank3.support_resp"), 'support_end'),
      support_end: line('long', 'happy', t("content.dialogue.story.long_hangout_rank3.support_end")),
      listen: line('khue', 'neutral', t("content.dialogue.story.long_hangout_rank3.listen_resp"), 'listen_end'),
      listen_end: line('long', 'happy', t("content.dialogue.story.long_hangout_rank3.listen_end"))
    }
  },

  // Scene 4: Hạ Tuyết Nhi Rank 4 - Cầu tàu lộng gió lúc hoàng hôn & Tháo bỏ vỏ bọc lý tính
  nhi_hangout_rank4: {
    title: t("content.dialogue.story.nhi_hangout_rank4.title"),
    nodes: {
      start: line('nhi', 'neutral', t("content.dialogue.story.nhi_hangout_rank4.start"), 'notebook'),
      notebook: line('nhi', 'serious', t("content.dialogue.story.nhi_hangout_rank4.notebook"), 'vulnerability'),
      vulnerability: line('nhi', 'serious', t("content.dialogue.story.nhi_hangout_rank4.vulnerability"), 'decision'),
      decision: {
        ...line('nhi', 'neutral', t("content.dialogue.story.nhi_hangout_rank4.decision")),
        choices: [
          { label: t("content.dialogue.story.nhi_hangout_rank4.choice_academic"), next: 'academic' },
          { label: t("content.dialogue.story.nhi_hangout_rank4.choice_romance"), next: 'romance' }
        ]
      },
      academic: line('khue', 'happy', t("content.dialogue.story.nhi_hangout_rank4.academic_resp"), 'academic_end'),
      academic_end: line('nhi', 'happy', t("content.dialogue.story.nhi_hangout_rank4.academic_end")),
      romance: line('khue', 'serious', t("content.dialogue.story.nhi_hangout_rank4.romance_resp"), 'romance_end'),
      romance_end: line('nhi', 'happy', t("content.dialogue.story.nhi_hangout_rank4.romance_end"))
    }
  },

  // Scene 5: Tạ Như Ngọc Rank 4 - Phòng tối tráng phim thủ công & Khung hình chân thực
  ngoc_hangout_rank4: {
    title: t("content.dialogue.story.ngoc_hangout_rank4.title"),
    nodes: {
      start: line('ngoc', 'neutral', t("content.dialogue.story.ngoc_hangout_rank4.start"), 'darkroom'),
      darkroom: line('ngoc', 'happy', t("content.dialogue.story.ngoc_hangout_rank4.darkroom"), 'confession'),
      confession: line('ngoc', 'serious', t("content.dialogue.story.ngoc_hangout_rank4.confession"), 'decision'),
      decision: {
        ...line('ngoc', 'serious', t("content.dialogue.story.ngoc_hangout_rank4.decision")),
        choices: [
          { label: t("content.dialogue.story.ngoc_hangout_rank4.choice_artistic"), next: 'artistic' },
          { label: t("content.dialogue.story.ngoc_hangout_rank4.choice_romance"), next: 'romance' }
        ]
      },
      artistic: line('khue', 'happy', t("content.dialogue.story.ngoc_hangout_rank4.artistic_resp"), 'artistic_end'),
      artistic_end: line('ngoc', 'happy', t("content.dialogue.story.ngoc_hangout_rank4.artistic_end")),
      romance: line('khue', 'serious', t("content.dialogue.story.ngoc_hangout_rank4.romance_resp"), 'romance_end'),
      romance_end: line('ngoc', 'happy', t("content.dialogue.story.ngoc_hangout_rank4.romance_end"))
    }
  },

  // Scene 6: Ngô Thiên Ân Rank 3 - Tiệm mì đêm Hải Vọng & Biến số con người
  an_hangout_rank3: {
    title: t("content.dialogue.story.an_hangout_rank3.title"),
    nodes: {
      start: line('an', 'neutral', t("content.dialogue.story.an_hangout_rank3.start"), 'ramen'),
      ramen: line('an', 'serious', t("content.dialogue.story.an_hangout_rank3.ramen"), 'past'),
      past: line('an', 'serious', t("content.dialogue.story.an_hangout_rank3.past"), 'decision'),
      decision: {
        ...line('an', 'serious', t("content.dialogue.story.an_hangout_rank3.decision")),
        choices: [
          { label: t("content.dialogue.story.an_hangout_rank3.choice_empathy"), next: 'empathy' },
          { label: t("content.dialogue.story.an_hangout_rank3.choice_logic"), next: 'logic' }
        ]
      },
      empathy: line('khue', 'serious', t("content.dialogue.story.an_hangout_rank3.empathy_resp"), 'empathy_end'),
      empathy_end: line('an', 'happy', t("content.dialogue.story.an_hangout_rank3.empathy_end")),
      logic: line('khue', 'investigate', t("content.dialogue.story.an_hangout_rank3.logic_resp"), 'logic_end'),
      logic_end: line('an', 'happy', t("content.dialogue.story.an_hangout_rank3.logic_end"))
    }
  }
};

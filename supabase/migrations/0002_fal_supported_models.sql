update public.models
set
  adapter = 'fal',
  api_model_name = 'fal:google-gemini-25-pro-tts',
  default_voice = 'Kore',
  updated_at = now()
where id = 'google-gemini-25-pro-tts';

update public.models
set
  adapter = 'fal',
  api_model_name = 'fal:google-gemini-31-flash-tts',
  default_voice = 'Kore',
  updated_at = now()
where id = 'google-gemini-31-flash-tts';

update public.models
set
  adapter = 'fal',
  api_model_name = 'fal:google-gemini-25-flash-tts',
  default_voice = 'Kore',
  updated_at = now()
where id = 'google-gemini-25-flash-tts';

update public.models
set
  adapter = 'fal',
  api_model_name = 'fal-ai/elevenlabs/tts/eleven-v3',
  default_voice = 'Aria',
  updated_at = now()
where id = 'elevenlabs-eleven-v3';

update public.models
set
  adapter = 'fal',
  api_model_name = 'xai/tts/v1',
  default_voice = 'eve',
  updated_at = now()
where id = 'xai-grok-tts';

update public.models
set
  adapter = 'fal',
  api_model_name = 'fal:minimax-speech-25-turbo',
  default_voice = 'English_Trustworth_Man',
  updated_at = now()
where id = 'minimax-speech-25-turbo';

update public.models
set
  adapter = 'fal',
  api_model_name = 'fal:minimax-speech-02-hd',
  default_voice = 'English_Trustworth_Man',
  updated_at = now()
where id = 'minimax-speech-02-hd';

update public.models
set
  adapter = 'fal',
  api_model_name = 'fal:inworld-tts-15-max',
  default_voice = 'default',
  updated_at = now()
where id = 'inworld-tts-15-max';

update public.models
set
  adapter = 'fal',
  api_model_name = 'fal:qwen3-tts-flash',
  default_voice = 'Cherry',
  updated_at = now()
where id = 'qwen3-tts-flash';

update public.models
set
  adapter = 'fal',
  api_model_name = 'fal:kokoro-tts',
  default_voice = 'af_heart',
  updated_at = now()
where id = 'kokoro-tts';

update public.models
set
  adapter = 'fal',
  api_model_name = 'fal:chatterbox',
  default_voice = 'default',
  updated_at = now()
where id = 'chatterbox';

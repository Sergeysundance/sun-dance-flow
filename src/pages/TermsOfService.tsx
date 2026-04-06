const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-black mb-8 text-foreground">
          Пользовательское соглашение
        </h1>

        <div className="prose prose-sm max-w-none space-y-6 font-body text-muted-foreground">
          <p className="text-sm">Дата последнего обновления: 06 апреля 2026 г.</p>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">1. Общие положения</h2>
            <p>
              Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения между
              школой танцев Sun Dance School (Школа танцев Сан Дэнс), расположенной по адресу:
              пр. Ветеранов 147В, Санкт-Петербург (далее — «Школа»), и пользователем сайта (далее — «Пользователь»).
            </p>
            <p>
              Регистрация на сайте означает полное и безоговорочное согласие Пользователя с условиями
              настоящего Соглашения.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">2. Предмет соглашения</h2>
            <p>
              Школа предоставляет Пользователю доступ к сервису записи на занятия, управления абонементами
              и иным функциям личного кабинета на условиях, изложенных в настоящем Соглашении.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">3. Регистрация и учётная запись</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Для использования сервиса необходима регистрация с указанием достоверных данных</li>
              <li>Пользователь обязуется не передавать данные своей учётной записи третьим лицам</li>
              <li>Пользователь несёт ответственность за все действия, совершённые с использованием его учётной записи</li>
              <li>Школа вправе заблокировать учётную запись при нарушении условий Соглашения</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">4. Абонементы и оплата</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Стоимость абонементов указана на сайте и может быть изменена Школой</li>
              <li>Оплата производится через доступные на сайте способы оплаты</li>
              <li>Абонемент действует в течение срока, указанного при покупке</li>
              <li>Неиспользованные занятия по истечении срока абонемента не компенсируются</li>
              <li>Возврат средств осуществляется в соответствии с законодательством РФ (Закон о защите прав потребителей)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">5. Запись и отмена занятий</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Пользователь может записаться на занятие при наличии активного абонемента</li>
              <li>Отмена записи возможна не позднее чем за 6 часов до начала занятия</li>
              <li>При отмене записи в установленный срок час абонемента возвращается</li>
              <li>Школа вправе отменить занятие с уведомлением записанных учеников</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">6. Заморозка абонемента</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Заморозка абонемента возможна один раз за период действия</li>
              <li>Во время заморозки запись на новые занятия невозможна</li>
              <li>Срок действия абонемента продлевается на период заморозки</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">7. Обязанности пользователя</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Предоставлять достоверную информацию при регистрации</li>
              <li>Соблюдать правила поведения в Школе</li>
              <li>Не использовать сервис в целях, противоречащих законодательству</li>
              <li>Своевременно уведомлять об изменении персональных данных</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">8. Ответственность</h2>
            <p>
              Школа не несёт ответственности за невозможность использования сервиса по причинам,
              не зависящим от Школы (технические сбои, действия третьих лиц, форс-мажор).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">9. Удаление аккаунта</h2>
            <p>
              Пользователь вправе в любое время удалить свой аккаунт через настройки профиля.
              При удалении аккаунта все персональные данные, записи на занятия, абонементы и бонусные
              баллы удаляются безвозвратно.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">10. Изменение условий</h2>
            <p>
              Школа оставляет за собой право изменять условия настоящего Соглашения. Актуальная версия
              Соглашения размещена на данной странице. Продолжение использования сервиса после внесения
              изменений означает согласие с обновлёнными условиями.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">11. Контактная информация</h2>
            <p>По всем вопросам обращайтесь:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Телефон: +7 (921) 413-18-30</li>
              <li>Telegram: @bachatasolnechno</li>
              <li>Адрес: пр. Ветеранов 147В, Санкт-Петербург</li>
            </ul>
          </section>
        </div>

        <div className="mt-10">
          <a href="/" className="font-body text-sm text-sun hover:underline">← Вернуться на главную</a>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

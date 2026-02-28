import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'ru' | 'en';

export const translations = {
    ru: {
        'nav.home': 'Главная',
        'nav.instances': 'Сборки',
        'nav.mods': 'Моды',
        'nav.accounts': 'Аккаунты',
        'nav.settings': 'Настройки',

        'home.subtitle': 'Minecraft Launcher нового поколения',
        'home.play': 'Играть',
        'home.launching': 'Запуск...',
        'home.launchError': 'Ошибка запуска:',
        'home.selectInstance': 'Выберите инстанс',
        'home.selectToLaunch': 'Выберите сборку для запуска:',
        'home.cancel': 'Отмена',
        'home.close': 'Закрыть',

        'instances.title': 'Мои сборки',
        'instances.new': 'Создать инстанс',
        'instances.configure': 'Настроить',
        'instances.play': 'Играть',
        'instances.kill': 'Остановить',
        'instances.launching': 'Подготовка к запуску...',
        'instances.deleteConfirm': 'Удаление сборки',
        'instances.deleteText': 'Вы действительно хотите безвозвратно удалить сборку',
        'instances.deleteWarning': 'Внимание: все миры, моды и настройки будут потеряны навсегда. Это действие нельзя отменить!',
        'instances.deleteYes': 'Да, удалить',

        'createInstance.title': 'Создать инстанс',
        'createInstance.vanilla': 'Vanilla / Custom',
        'createInstance.nameError': 'Введите название сборки',
        'createInstance.packError': 'Выберите модпак для установки',
        'createInstance.createError': 'Ошибка создания сборки',
        'createInstance.versionError': 'Ошибка загрузки версий Minecraft',
        'createInstance.version': 'Версия',
        'createInstance.loader': 'Загрузчик',
        'createInstance.searchPack': 'Поиск сборок...',
        'createInstance.search': 'Найти',
        'createInstance.namePlaceholder': 'Название сборки',
        'createInstance.createBtn': 'Создать',

        'mods.title': 'Моды',
        'mods.installed': 'Установленные',
        'mods.search': 'Поиск...',
        'mods.download': 'Скачать',
        'mods.delete': 'Удалить',
        'mods.on': 'Вкл',
        'mods.off': 'Выкл',
        'mods.author': 'Автор:',
        'mods.downloads': 'Скачиваний:',
        'mods.installMod': 'Установить мод',
        'mods.notFound': 'Ничего не найдено',
        'mods.searchPrompt': 'Введите запрос для поиска модов',
        'mods.searchError': 'Ошибка приложения',
        'mods.desc': 'Описание',
        'mods.selectInstance': 'Выберите инстанс для установки:',
        'mods.selectVersion': 'Выберите версию:',
        'mods.downloading': 'Загрузка...',
        'mods.downloadVersionBtn': 'Скачать выбранную версию',
        'mods.noInstances': 'Инстансы не найдены. Сначала создайте инстанс на главной.',
        'mods.noVersions': 'Нет подходящих версий этого мода для выбранного инстанса.',
        'mods.installTitle': 'Выберите инстанс',
        'mods.installConfirm': 'Вы собираетесь скачать мод',
        'mods.selectOther': 'Выбрать другой инстанс',
        'mods.fetchingVersions': 'Получение доступных версий файла...',
        'mods.downloadState': 'Состояние загрузки:',
        'mods.deleteTitle': 'Удаление мода',
        'mods.deleteConfirm': 'Вы действительно хотите удалить мод',
        'mods.deleteWarning': 'Это действие нельзя будет отменить. Файл будет удален с диска.',
        'mods.deleteYes': 'Удалить',

        'settings.title': 'Настройки',
        'settings.javaMemory': 'Java & Память',
        'settings.javaPath': 'Путь к Java',
        'settings.autoDetect': 'Автоматически определяется',
        'settings.select': 'Выбрать',
        'settings.maxRam': 'Максимальная память (RAM)',
        'settings.ramHint': 'Рекомендуется 4-8 ГБ для модов',
        'settings.jvmArgs': 'Аргументы JVM',
        'settings.jvmHint': 'Дополнительные параметры запуска',
        'settings.appearance': 'Внешний вид',
        'settings.theme': 'Тема',
        'settings.dark': 'Тёмная',
        'settings.light': 'Светлая',
        'settings.cream': 'Кремовая',
        'settings.language': 'Язык',
        'settings.ru': 'Русский',
        'settings.en': 'English',
        'settings.launch': 'Запуск',
        'settings.showConsole': 'Показывать консоль',

        'instances.config.title': 'Настройка',
        'instances.config.version': 'Версия',
        'instances.config.mods': 'Моды',
        'instances.config.resourcePacks': 'Ресурс Пак',
        'instances.config.shaders': 'Шейдеры',
        'instances.config.servers': 'Серверы',
        'instances.config.modpack': 'Сборки',
        'instances.config.console': 'Логи игры',
        'instances.config.settings': 'Настройки',
        'instances.config.openResourcePacks': 'Открыть папку resourcepacks',
        'instances.config.manageResourcePacks': 'Управление ресурс-паками для этого инстанса.',
        'instances.config.openShaders': 'Открыть папку shaderpacks',
        'instances.config.manageShaders': 'Управление шейдерами OptiFine/Iris для этого инстанса.',
        'instances.config.close': 'Закрыть',
        'instances.config.launch': 'Играть',

        'instances.config.loading': 'Загрузка...',
        'instances.config.errorLoad': 'Ошибка загрузки конфигурации.',
        'instances.config.openFolder': 'Открыть папку',
        'instances.config.statusActive': '✔ Активен',
        'instances.config.statusConfigured': '✔ Настроен',

        'instances.config.version.title': 'Версии компонентов',
        'instances.config.version.desc': 'Управление версиями ядра Minecraft и загрузчиков.',
        'instances.config.version.component': 'Компонент',
        'instances.config.version.version': 'Версия',
        'instances.config.version.status': 'Статус',
        'instances.config.version.autoResolved': '(Авто-выбор)',

        'instances.config.mods.title': 'Моды (установлено: {{count}})',
        'instances.config.mods.desc': 'Включение, отключение и удаление модов.',
        'instances.config.mods.addJar': 'Добавить .jar',
        'instances.config.mods.empty': 'В этой сборке нет установленных модов.',
        'instances.config.mods.colEnabled': 'Вкл',
        'instances.config.mods.colName': 'Название',
        'instances.config.mods.colFile': 'Файл',
        'instances.config.mods.colActions': 'Действия',
        'instances.config.mods.deleteTitle': 'Удалить мод?',
        'instances.config.mods.deleteMsg': 'Вы уверены, что хотите безвозвратно удалить файл {{mod}} из сборки?',

        'instances.config.settings.title': 'Настройки инстанса',
        'instances.config.settings.desc': 'Переопределение глобальных настроек лаунчера для этой сборки.',
        'instances.config.settings.memory': 'Выделение памяти',
        'instances.config.settings.minMem': 'Минимум памяти (МБ)',
        'instances.config.settings.maxMem': 'Максимум памяти (МБ)',
        'instances.config.settings.java': 'Настройки Java',
        'instances.config.settings.javaPath': 'Пользовательский путь к Java (оставьте пустым для глобального)',
        'instances.config.settings.jvmArgs': 'Дополнительные аргументы JVM',
        'instances.config.settings.save': 'Сохранить',
        'instances.config.settings.saving': 'Сохранение...',
        'instances.config.settings.saved': 'Сохранено!',

        'instances.config.console.title': 'Логи игры',
        'instances.config.console.desc': 'Вывод игры в реальном времени для устранения неполадок.',
        'instances.config.console.copy': 'Копировать',
        'instances.config.console.clear': 'Очистить',
        'instances.config.console.waiting': 'Ожидание вывода логов... Запустите игру, чтобы увидеть их здесь.',

        'instances.config.modpack.loading': 'Загрузка информации о сборке...',
        'instances.config.modpack.title': 'Информация о сборке',
        'instances.config.modpack.desc': 'Управление метаданными и обновлениями удаленной сборки.',
        'instances.config.modpack.notLinked': 'Этот инстанс не привязан к удаленной сборке.',
        'instances.config.modpack.packName': 'Название сборки:',
        'instances.config.modpack.curVer': 'Текущая версия:',
        'instances.config.modpack.unknown': 'Неизвестно',
        'instances.config.modpack.source': 'Источник:',
        'instances.config.modpack.updateTo': 'Обновить до версии:',
        'instances.config.modpack.notImpl': 'Обновления пока не реализованы',
        'instances.config.modpack.updateBtn': 'Обновить сборку',
        'instances.config.modpack.changelog': 'Список изменений',
        'instances.config.modpack.changelogNotImpl': 'Автообновление запланировано в будущих версиях.',

        'instances.config.servers.title': 'Многопользовательские серверы',
        'instances.config.servers.desc': 'Управление серверами, которые появятся в вашем списке для этого инстанса.',
        'instances.config.servers.addTitle': 'Добавить новый сервер',
        'instances.config.servers.name': 'Название сервера',
        'instances.config.servers.namePlaceholder': 'Мой сервер Minecraft',
        'instances.config.servers.ip': 'Адрес сервера',
        'instances.config.servers.ipPlaceholder': 'play.example.com',
        'instances.config.servers.adding': 'Добавление...',
        'instances.config.servers.addBtn': 'Добавить сервер',
        'instances.config.servers.installed': 'Установленные серверы ({{count}})',
        'instances.config.servers.loading': 'Загрузка серверов...',
        'instances.config.servers.empty': 'Серверы не настроены. Добавьте один выше!',
        'instances.config.servers.removeHover': 'Удалить сервер',
        'instances.config.servers.removeTitle': 'Удалить сервер?',
        'instances.config.servers.removeMsg': 'Вы уверены, что хотите удалить {{server}} из вашего списка?',
        'instances.config.servers.removeBtn': 'Удалить',

    },
    en: {
        'nav.home': 'Home',
        'nav.instances': 'Instances',
        'nav.mods': 'Mods',
        'nav.accounts': 'Accounts',
        'nav.settings': 'Settings',

        'home.subtitle': 'Next Generation Minecraft Launcher',
        'home.play': 'Play',
        'home.launching': 'Launching...',
        'home.launchError': 'Launch Error:',
        'home.selectInstance': 'Select Instance',
        'home.selectToLaunch': 'Select an instance to launch:',
        'home.cancel': 'Cancel',
        'home.close': 'Close',

        'instances.title': 'Instances',
        'instances.new': 'New Instance',
        'instances.configure': 'Configure',
        'instances.play': 'Play',
        'instances.kill': 'Kill Process',
        'instances.launching': 'Preparing to launch...',
        'instances.deleteConfirm': 'Delete Instance',
        'instances.deleteText': 'Are you sure you want to permanently delete the instance',
        'instances.deleteWarning': 'Warning: all worlds, mods, and settings will be lost forever. This action cannot be undone!',
        'instances.deleteYes': 'Yes, delete',

        'createInstance.title': 'Add Instance',
        'createInstance.vanilla': 'Vanilla / Custom',
        'createInstance.nameError': 'Please enter an instance name',
        'createInstance.packError': 'Please select a modpack to install',
        'createInstance.createError': 'Failed to create instance',
        'createInstance.versionError': 'Failed to fetch Minecraft versions',
        'createInstance.version': 'Version',
        'createInstance.loader': 'Loader',
        'createInstance.searchPack': 'Search modpacks...',
        'createInstance.search': 'Search',
        'createInstance.namePlaceholder': 'Instance name',
        'createInstance.createBtn': 'Create',

        'mods.title': 'Mods',
        'mods.installed': 'Installed',
        'mods.search': 'Search...',
        'mods.download': 'Download',
        'mods.delete': 'Delete',
        'mods.on': 'On',
        'mods.off': 'Off',
        'mods.author': 'Author:',
        'mods.downloads': 'Downloads:',
        'mods.installMod': 'Install Mod',
        'mods.notFound': 'Nothing found',
        'mods.searchPrompt': 'Enter a query to search for mods',
        'mods.searchError': 'App error',
        'mods.desc': 'Description',
        'mods.selectInstance': 'Select an instance to install into:',
        'mods.selectVersion': 'Select version:',
        'mods.downloading': 'Downloading...',
        'mods.downloadVersionBtn': 'Download selected version',
        'mods.noInstances': 'No instances found. Create an instance on the home page first.',
        'mods.noVersions': 'No compatible versions of this mod for the selected instance.',
        'mods.installTitle': 'Select Instance',
        'mods.installConfirm': 'You are about to download the mod',
        'mods.selectOther': 'Select another instance',
        'mods.fetchingVersions': 'Fetching available versions...',
        'mods.downloadState': 'Download state:',
        'mods.deleteTitle': 'Delete Mod',
        'mods.deleteConfirm': 'Are you sure you want to delete the mod',
        'mods.deleteWarning': 'This action cannot be undone. The file will be deleted from the disk.',
        'mods.deleteYes': 'Delete',

        'settings.title': 'Settings',
        'settings.javaMemory': 'Java & Memory',
        'settings.javaPath': 'Java Path',
        'settings.autoDetect': 'Auto-detected',
        'settings.select': 'Select',
        'settings.maxRam': 'Maximum Memory (RAM)',
        'settings.ramHint': '4-8 GB recommended for modded gameplay',
        'settings.jvmArgs': 'JVM Arguments',
        'settings.jvmHint': 'Additional launch parameters',
        'settings.appearance': 'Appearance',
        'settings.theme': 'Theme',
        'settings.dark': 'Dark',
        'settings.light': 'Light',
        'settings.cream': 'Cream',
        'settings.language': 'Language',
        'settings.ru': 'Русский',
        'settings.en': 'English',
        'settings.launch': 'Launch',
        'settings.showConsole': 'Show Console',

        'instances.config.title': 'Configuration',
        'instances.config.version': 'Version',
        'instances.config.mods': 'Mods',
        'instances.config.resourcePacks': 'Resource Packs',
        'instances.config.shaders': 'Shaders',
        'instances.config.servers': 'Servers',
        'instances.config.modpack': 'Modpack',
        'instances.config.console': 'Minecraft Log',
        'instances.config.settings': 'Settings',
        'instances.config.openResourcePacks': 'Open resourcepacks folder',
        'instances.config.manageResourcePacks': 'Manage resource packs for this instance.',
        'instances.config.openShaders': 'Open shaderpacks folder',
        'instances.config.manageShaders': 'Manage OptiFine/Iris shader packs for this instance.',
        'instances.config.close': 'Close',
        'instances.config.launch': 'Launch',

        'instances.config.loading': 'Loading...',
        'instances.config.errorLoad': 'Failed to load config.',
        'instances.config.openFolder': 'Open Folder',
        'instances.config.statusActive': '✔ Active',
        'instances.config.statusConfigured': '✔ Configured',

        'instances.config.version.title': 'Version Details',
        'instances.config.version.desc': 'Manage the core components installed for this instance.',
        'instances.config.version.component': 'Component',
        'instances.config.version.version': 'Version',
        'instances.config.version.status': 'Status',
        'instances.config.version.autoResolved': '(Auto-resolved)',

        'instances.config.mods.title': 'Mods ({{count}} installed)',
        'instances.config.mods.desc': 'Enable, disable, or delete modifications.',
        'instances.config.mods.addJar': 'Add .jar',
        'instances.config.mods.empty': 'No mods installed in this instance.',
        'instances.config.mods.colEnabled': 'Enabled',
        'instances.config.mods.colName': 'Mod Name',
        'instances.config.mods.colFile': 'File Name',
        'instances.config.mods.colActions': 'Actions',
        'instances.config.mods.deleteTitle': 'Delete mod?',
        'instances.config.mods.deleteMsg': 'Are you sure you want to permanently delete {{mod}} from the instance?',

        'instances.config.settings.title': 'Instance Settings',
        'instances.config.settings.desc': 'Override global launcher settings for this specific instance.',
        'instances.config.settings.memory': 'Memory Allocation',
        'instances.config.settings.minMem': 'Minimum Memory (MB)',
        'instances.config.settings.maxMem': 'Maximum Memory (MB)',
        'instances.config.settings.java': 'Java Settings',
        'instances.config.settings.javaPath': 'Custom Java Path (Leave empty to use Global default)',
        'instances.config.settings.jvmArgs': 'Additional JVM Arguments',
        'instances.config.settings.save': 'Save Settings',
        'instances.config.settings.saving': 'Saving...',
        'instances.config.settings.saved': 'Saved!',

        'instances.config.console.title': 'Minecraft Log',
        'instances.config.console.desc': 'Real-time game output for troubleshooting.',
        'instances.config.console.copy': 'Copy',
        'instances.config.console.clear': 'Clear',
        'instances.config.console.waiting': 'Waiting for log output... Launch the game to view logs here.',

        'instances.config.modpack.loading': 'Loading pack info...',
        'instances.config.modpack.title': 'Modpack Information',
        'instances.config.modpack.desc': 'Manage remote modpack metadata and updates.',
        'instances.config.modpack.notLinked': 'This instance is not linked to a remote modpack.',
        'instances.config.modpack.packName': 'Pack name:',
        'instances.config.modpack.curVer': 'Current version:',
        'instances.config.modpack.unknown': 'Unknown',
        'instances.config.modpack.source': 'Source:',
        'instances.config.modpack.updateTo': 'Update to version:',
        'instances.config.modpack.notImpl': 'Updates not implemented yet',
        'instances.config.modpack.updateBtn': 'Update pack',
        'instances.config.modpack.changelog': 'Changelog',
        'instances.config.modpack.changelogNotImpl': 'Auto-updating is planned for a future release.',

        'instances.config.servers.title': 'Multiplayer Servers',
        'instances.config.servers.desc': 'Manage servers that appear in your multiplayer list for this instance.',
        'instances.config.servers.addTitle': 'Add New Server',
        'instances.config.servers.name': 'Server Name',
        'instances.config.servers.namePlaceholder': 'Minecraft Server',
        'instances.config.servers.ip': 'Server Address',
        'instances.config.servers.ipPlaceholder': 'play.example.com',
        'instances.config.servers.adding': 'Adding...',
        'instances.config.servers.addBtn': 'Add Server',
        'instances.config.servers.installed': 'Installed Servers ({{count}})',
        'instances.config.servers.loading': 'Loading servers...',
        'instances.config.servers.empty': 'No servers configured. Add one above!',
        'instances.config.servers.removeHover': 'Remove Server',
        'instances.config.servers.removeTitle': 'Remove Server?',
        'instances.config.servers.removeMsg': 'Are you sure you want to remove {{server}} from your multiplayer list?',
        'instances.config.servers.removeBtn': 'Remove',

    }
};

type TranslationKey = keyof typeof translations['ru'];

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey, args?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'ru',
    setLanguage: () => { },
    t: (key) => key,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>('ru');

    useEffect(() => {
        // Load initial language from settings
        // @ts-ignore
        if (window.pentagon && window.pentagon.settings) {
            // @ts-ignore
            window.pentagon.settings.get().then((settings: any) => {
                if (settings && settings.language && (settings.language === 'en' || settings.language === 'ru')) {
                    setLanguageState(settings.language as Language);
                }
            }).catch(console.error);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        // @ts-ignore
        if (window.pentagon && window.pentagon.settings) {
            // @ts-ignore
            window.pentagon.settings.set({ language: lang }).catch(console.error);
        }
    };

    const t = (key: TranslationKey, args?: Record<string, string | number>): string => {
        let str = translations[language][key] || translations['ru'][key] || key;
        if (args) {
            Object.keys(args).forEach(k => {
                str = str.replace(new RegExp(`{{${k}}}`, 'g'), String(args[k]));
            });
        }
        return str;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => useContext(LanguageContext);

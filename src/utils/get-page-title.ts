const title = '小而美的智慧社区系统'

export default function getPageTitle(pageTitle?: string) {
    if (pageTitle) {
        return `${pageTitle} - ${title}`
    }
    return `${title}`
}
import './css/admin.scss'

import './elements/index.js'
import './modules/scrollreveal.js'
import './modules/highlight.js'

import { DatePicker } from './elements/DatePicker.js'
import { UserSelect } from './elements/admin/UserSelect.js'
import InputAttachment from './elements/admin/InputAttachment.js'
import FileManager from './elements/admin/filemanager/index.js'
import { ChaptersEditor } from './elements/admin/ChaptersEditor.js'
import { ItemSorter } from './elements/admin/ItemSorter.js'
import { FormNotification } from './elements/admin/FormNotification.jsx'
import preactCustomElement from './functions/preact'
import Turbolinks from "turbolinks";

customElements.define('input-attachment', InputAttachment, { extends: 'input' })
customElements.define('file-manager', FileManager)
customElements.define('date-picker', DatePicker, { extends: 'input' })
customElements.define('chapters-editor', ChaptersEditor, { extends: 'textarea' })
customElements.define('item-sorter', ItemSorter)
customElements.define('user-select', UserSelect, { extends: 'select' })
preactCustomElement('form-notification', FormNotification)

document.addEventListener('turbolinks:load', () => {
})

Turbolinks.start()


import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import {
  Activity,
  AppWindow,
  AlertCircle,
  Braces,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileText,
  FileUp,
  Lightbulb,
  LayoutDashboard,
  ListChecks,
  PanelLeftClose,
  RotateCcw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  PanelLeftOpen,
  Bold,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Undo2,
  Link2,
  Redo2,
  Plus,
  ImagePlus,
} from 'lucide-react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import UnderlineExtension from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import DOMPurify from 'dompurify'
import Image from '@tiptap/extension-image'
import { parseFinder, parseSmartContext } from './parsers'
import type { ApplicationForm, FinderRow, SmartContextRow } from './types'


// -----------------------------------------------------------------------------
// Constants and types
// -----------------------------------------------------------------------------

const starterSC = `{
  "app_identifier_rules": [],
  "rule_config_is": {},
  "naming_rule_config_is": {},
  "include_name_for_page": true
}`

const starterFinder = `{
  "rules": []
}`
const starterSmartDetectDescription = `
<p>
  Smart Detect is a core technology and a pre-configured algorithmic framework
  within Whatfix that is designed to enhance the efficiency and accuracy of
  element detection on web applications. Its primary goal is to provide a
  superior element selection experience for authors creating content using
  Whatfix, which involves minimizing the need for manual configuration,
  enhancing visibility into the application's elements, and mitigating
  content failures.
</p>

<p>
  This algorithm can be further strengthened by providing application-specific
  rules. You can find the same by clicking
  <a
    href="https://docs.google.com/document/d/18tc9kTu4t36430G82qi7aKrYi0vYgf6P4mrlD3x-IeI/edit#heading=h.sfo821iqvjaf"
    target="_blank"
    rel="noopener noreferrer"
  >here</a>.
</p>
`
const starterSmartContextDescription = `
<p>
  Smart Context eliminates the need to create multiple segments (manually)
  to display relevant content contextually to different pages/audiences on
  an application.
  <a
    href="https://support.whatfix.com/docs/smart-context"
    target="_blank"
    rel="noopener noreferrer"
  >Click here</a>
  to learn more about Smart Context.
</p>
`
const starterUniqueUserDescription = `
<p>
  User Identification enables Whatfix to uniquely identify users and provide
  more accurate analytics on their interactions with Whatfix widgets and
  content. This helps to determine and manage user session-based features such
  as displaying unique user counts in analytics, keeping track of popup view
  counts, and monitoring task list completion.
</p>

<p>
  For more information, we encourage you to visit our support article by
  clicking
  <a
    href="https://support.whatfix.com/studio/docs/en/identifying-unique-users-in-whatfix-analytics"
    target="_blank"
    rel="noopener noreferrer"
  >here</a>.
</p>

<h4>Benefits</h4>

<ul>
  <li>
    Obtain an accurate count of users who are engaging with the platform and
    the applications they use.
  </li>
  <li>
    Enables better user guidance and platform improvement through an in-depth
    understanding of user actions, behavior, and engagement.
  </li>
  <li>
    Ensures accurate tracking of user interactions, enabling features like
    limited popup displays or task completion tracking, etc.
  </li>
</ul>

<p>
  <strong>Have to receive the confirmation from the client for the capture of the user id.</strong>
</p>
`
const starterRoleSegmentationDescription = `
<p>
  Whatfix enables you to show different content to different users with the
  use of Role tags. This helps in targeting information based on what users
  can do on your application.
</p>

<p>
  For more information, we encourage you to visit our support article by
  clicking
  <a
    href="https://support.whatfix.com/docs/display-content-based-on-user-roles"
    target="_blank"
    rel="noopener noreferrer"
  >here</a>.
</p>
`
const initialForm: ApplicationForm = {
  customerName: '',
  applicationName: '',
  entName: '',
  version: '',
  analysisStartDate: '',
  analysisEndDate: '',
  ootb: '',
  iframes: '',
  languages: '',
  development: '',
  personas: '',
  browsers: '',
  smartContextStatus: 'Not started',
  elementDetectionStatus: 'Not started',
  uniqueUserStatus: 'Not started',
  roleSegmentationStatus: 'Not started',
  observations: '',
  recommendations: '',
}

type SectionId =
  | 'overview'
  | 'observations'
  | 'recommendations'
  | 'applicationDetails'
  | 'checklist'
  | 'details'
  | 'technicalConfiguration'

type DetailTab =
  | 'smartContext'
  | 'smartDetect'
  | 'uniqueUser'
  | 'roleSegmentation'


type SmartContextSectionType =
  | 'Global'
  | 'Subglobal'
  | 'Page'
  | 'Popup'
  | 'Iframe'
  | 'Dropdown'
  | 'Sidebar'
  | 'Left Panel'
  | 'Custom'

type SmartContextSection = {
  id: string
  type: SmartContextSectionType | ''
  customName: string
  content: string
  expanded?: boolean
}
type SmartContextIdentification = {
  identification: string
  attribute: string
}

type SmartContextTableSection = {
  section: string
  scope: string[]
  identifications: SmartContextIdentification[]
}

type SmartContextTable = {
  sections: SmartContextTableSection[]
  warnings: string[]
}

type JsonConfigEntry = {
  id: string
  name?: string
  value: string
  expanded: boolean
  valid: boolean | null
  error: string
  table?: SmartContextTable
}
const smartContextSectionTypes: SmartContextSectionType[] = [
  'Global',
  'Subglobal',
  'Page',
  'Popup',
  'Iframe',
  'Dropdown',
  'Sidebar',
  'Left Panel',
  'Custom',
]

// Each section has its own independent description template.
const smartContextDescriptions: Record<
  Exclude<SmartContextSectionType, 'Custom'>,
  string
> = {
  Global: `<p>Components or elements that are consistently present and accessible across the entire application. These elements typically serve foundational or navigational roles and contribute to the overall user experience and interface consistency.</p>
<p>Creating content on a global element will ensure its availability throughout the app, regardless of what page the user is on. Creating steps on such elements ensures users can navigate to any section of the application.</p>`,

  Subglobal: `<p>Components or elements that are consistently present across specific sections or modules of the application, rather than the entire application. These elements usually provide a layer of consistency within a particular context or feature set, supporting navigation and interaction within those specific areas. Unlike global elements, which appear throughout the entire application, sub-global elements are more contextually bound.</p>
<p>Just as with global elements, creating steps on sub-global elements ensures smooth navigation between linked sections.</p>`,

  Page: `<p>The main content area that is unique to a specific view or section of a web application. This is the core content that users interact with when they navigate to a particular page.</p>
<p>With SC configured, a flow will start from the page or location that the end-user is currently on.</p>`,

  Popup: `<p>UI elements that appear on top of the main content in a web application, typically to draw the user's attention to specific information or actions. They usually darken or disable the background content, and are often used to convey messages, prompt actions, or provide additional content without navigating away from the current page.</p>
<p>With SC configured, a flow will start from the popup, even skipping the steps created on the background page.</p>`,

  Iframe: `<p>UI elements that appear on top of the main content in a web application, typically to draw the user's attention to specific information or actions. They usually darken or disable the background content, and are often used to convey messages, prompt actions, or provide additional content without navigating away from the current page.</p>
<p>With SC configured, a flow will start from the popup, even skipping the steps created on the background page.</p>`,

  Dropdown: `<p>UI elements that appear on top of the main content in a web application, typically to draw the user's attention to specific information or actions. They usually darken or disable the background content, and are often used to convey messages, prompt actions, or provide additional content without navigating away from the current page.</p>
<p>With SC configured, a flow will start from the popup, even skipping the steps created on the background page.</p>`,

  Sidebar: `<p>UI elements that appear on top of the main content in a web application, typically to draw the user's attention to specific information or actions. They usually darken or disable the background content, and are often used to convey messages, prompt actions, or provide additional content without navigating away from the current page.</p>
<p>With SC configured, a flow will start from the popup, even skipping the steps created on the background page.</p>`,

  'Left Panel': `<p>UI elements that appear on top of the main content in a web application, typically to draw the user's attention to specific information or actions. They usually darken or disable the background content, and are often used to convey messages, prompt actions, or provide additional content without navigating away from the current page.</p>
<p>With SC configured, a flow will start from the popup, even skipping the steps created on the background page.</p>`,
}


type AuthUser = {
  name: string
  email: string
  initials: string
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'observations', label: 'Observations', icon: ListChecks },
  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
  { id: 'applicationDetails', label: 'Application Details', icon: AppWindow },
  { id: 'checklist', label: 'Application Analysis Checklist', icon: ClipboardCheck },
  { id: 'details', label: 'Details', icon: Braces },
  { id: 'technicalConfiguration', label: 'Technical Configuration Details', icon: Settings2 },
] satisfies { id: SectionId; label: string; icon: typeof LayoutDashboard }[]

const detailTabs = [
  { id: 'smartContext', label: 'Smart Context', icon: Braces },
  { id: 'smartDetect', label: 'Smart Detect', icon: Search },
  { id: 'uniqueUser', label: 'Unique User Identification', icon: UserRound },
  { id: 'roleSegmentation', label: 'Role Segmentation', icon: UsersRound },
] satisfies { id: DetailTab; label: string; icon: typeof Braces }[]

// -----------------------------------------------------------------------------
// Reusable components
// -----------------------------------------------------------------------------

function Field({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="select-wrap">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">- Select -</option>

          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown size={15} />
      </div>
    </label>
  )
}

// function DataTable({
//   title,
//   columns,
//   rows,
//   mergeFirstColumn = false,
//   count,
// }: {
//   title: string
//   columns: string[]
//   rows: string[][]
//   mergeFirstColumn?: boolean
//   count?: number
// }) {
//   return (
//     <div className="table-wrap">
//       <div className="table-title">
//         <b>{title}</b>
//         <span>
//           {count !== undefined ? `${count} section(s)` : `${rows.length} row(s)`}
//         </span>
//       </div>

//       <div className="table-scroll">
//         <table>
//           <thead>
//             <tr>
//               {columns.map((column) => (
//                 <th key={column}>{column}</th>
//               ))}
//             </tr>
//           </thead>

//           <tbody>
//             {rows.map((row, index) => {
//               const isMergedCell =
//                 mergeFirstColumn &&
//                 index > 0 &&
//                 row[0] === rows[index - 1][0]

//               let rowSpan = 1

//               if (mergeFirstColumn && !isMergedCell) {
//                 for (let i = index + 1; i < rows.length; i++) {
//                   if (rows[i][0] !== row[0]) break
//                   rowSpan++
//                 }
//               }

//               return (
//                 <tr key={index}>
//                   {row.map((cell, cellIndex) => {
//                     if (mergeFirstColumn && cellIndex <= 1 && isMergedCell) {
//                       return null
//                     }

//                     return (
//                       <td
//                         key={cellIndex}
//                         rowSpan={
//                           mergeFirstColumn && cellIndex <= 1
//                             ? rowSpan
//                             : undefined
//                         }
//                       >
//                         {cell || <span className="empty-cell">—</span>}
//                       </td>
//                     )
//                   })}
//                 </tr>
//               )
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   )
// }
function DataTable({
  title,
  columns,
  rows,
  mergeFirstColumn = false,
  count,
}: {
  title: string
  columns: string[]
  rows: string[][]
  mergeFirstColumn?: boolean
  count?: number
}) {
  const isSmartDetectTable =
    columns.length === 3 &&
    columns[0] === 'Scope' &&
    columns[1] === 'Attribute' &&
    columns[2] === 'Condition'

  return (
    <div className="table-wrap">
      <div className="table-title">
        <b>{title}</b>
        <span>
          {count !== undefined ? `${count} section(s)` : `${rows.length} row(s)`}
        </span>
      </div>

      <div className="table-scroll">
        <table
          style={
            isSmartDetectTable
              ? { width: '100%', tableLayout: 'fixed' }
              : undefined
          }
        >
          {isSmartDetectTable && (
            <colgroup>
              <col style={{ width: '55%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '25%' }} />
            </colgroup>
          )}

          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => {
              const isMergedCell =
                mergeFirstColumn &&
                index > 0 &&
                row[0] === rows[index - 1][0]

              let rowSpan = 1

              if (mergeFirstColumn && !isMergedCell) {
                for (let i = index + 1; i < rows.length; i++) {
                  if (rows[i][0] !== row[0]) break
                  rowSpan++
                }
              }

              return (
                <tr key={index}>
                  {row.map((cell, cellIndex) => {
                    if (mergeFirstColumn && cellIndex <= 1 && isMergedCell) {
                      return null
                    }

                    return (
                      <td
                        key={cellIndex}
                        rowSpan={
                          mergeFirstColumn && cellIndex <= 1
                            ? rowSpan
                            : undefined
                        }
                        style={
                          isSmartDetectTable && cellIndex === 0
                            ? { whiteSpace: 'pre-line' }
                            : undefined
                        }
                      >
                        {cell || <span className="empty-cell">—</span>}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
function RichTextEditor({
  value,
  onChange,
  placeholder = 'What did you observe during application analysis?',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [, setToolbarVersion] = useState(0)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      Image.configure({
        allowBase64: true,
        inline: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ['https'],
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'rich-text-content',
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    onSelectionUpdate: () => {
      setToolbarVersion((previous) => previous + 1)
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', {
        emitUpdate: false,
      })
    }
  }, [editor, value])

  if (!editor) return null

  return (
    <div className="rich-text-editor">
      <div className="rich-text-toolbar">
        <button
          type="button"
          title="Bold"
          aria-label="Bold"
          className={editor.isActive('bold') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={17} />
        </button>

        <button
          type="button"
          title="Underline"
          aria-label="Underline"
          className={editor.isActive('underline') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={17} />
        </button>
        <button
          type="button"
          title="Add or edit link"
          aria-label="Add or edit link"
          className={editor.isActive('link') ? 'active' : ''}
          onClick={() => {
            const previousUrl = editor.getAttributes('link').href as string | undefined
            const url = window.prompt('Enter URL', previousUrl || 'https://')

            if (url === null) return

            if (!url.trim()) {
              editor.chain().focus().extendMarkRange('link').unsetLink().run()
              return
            }

            try {
              const parsedUrl = new URL(url)

              if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                throw new Error('Invalid protocol')
              }

              editor
                .chain()
                .focus()
                .extendMarkRange('link')
                .setLink({ href: parsedUrl.href })
                .run()
            } catch {
              window.alert('Please enter a valid HTTP or HTTPS URL.')
            }
          }}
        >
          <Link2 size={17} />
        </button>
        <span className="toolbar-divider" />

        <button
          type="button"
          title="Numbered list"
          aria-label="Numbered list"
          className={editor.isActive('orderedList') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={18} />
        </button>

        <button
          type="button"
          title="Bulleted list"
          aria-label="Bulleted list"
          className={editor.isActive('bulletList') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={18} />
        </button>

        <span className="toolbar-divider" />

        <button
          type="button"
          title="Undo"
          aria-label="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={17} />
        </button>

        <button
          type="button"
          title="Redo"
          aria-label="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={17} />
        </button>

        <button
          type="button"
          title="Upload image"
          aria-label="Upload image"
          onClick={() => imageInputRef.current?.click()}
        >
          <ImagePlus size={17} />
        </button>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file || !editor) return

            if (!file.type.startsWith('image/')) {
              event.target.value = ''
              return
            }

            if (file.size > 5 * 1024 * 1024) {
              window.alert('Please select an image smaller than 5 MB.')
              event.target.value = ''
              return
            }

            const reader = new FileReader()

            reader.onload = () => {
              if (typeof reader.result === 'string') {
                editor
                  .chain()
                  .focus()
                  .setImage({
                    src: reader.result,
                    alt: file.name,
                  })
                  .run()
              }
            }

            reader.readAsDataURL(file)
            event.target.value = ''
          }}
        />
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}

function DocSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="doc-section">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

function PanelHeading({
  title,
  description,
  step,
  icon: Icon,
  color = 'purple',
}: {
  title: string
  description: string
  step: string
  icon: typeof LayoutDashboard
  color?: string
}) {
  return (
    <div className="panel-heading">
      <div className={`section-icon ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <span className="step-label">{step}</span>
    </div>
  )
}

function PanelFooter({
  onBack,
  onContinue,
  continueLabel = 'Continue →',
}: {
  onBack?: () => void
  onContinue: () => void
  continueLabel?: string
}) {
  return (
    <div className="panel-footer">
      {onBack ? (
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
      ) : (
        <span>
          {/* <ShieldCheck size={15} /> */}
          {/* Your inputs stay in this browser until exported. */}
        </span>
      )}

      <button className="btn btn-primary" onClick={onContinue}>
        {continueLabel}
      </button>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Application
// -----------------------------------------------------------------------------

function App() {
  // Authentication
  const [user, setUser] = useState<AuthUser | null>(null)
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  // Workspace
  const [form, setForm] = useState<ApplicationForm>(initialForm)
  const [active, setActive] = useState<SectionId>('overview')
  const [detailTab, setDetailTab] = useState<DetailTab>('smartContext')
  const [configTab, setConfigTab] = useState<'smartContext' | 'smartDetect'>(
    'smartContext'
  )
  const [visitedDetailTabs, setVisitedDetailTabs] = useState<DetailTab[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Configuration
  const [scJson, setScJson] = useState(starterSC)
  const [finderJson, setFinderJson] = useState(starterFinder)
  const [smartDetectDescription, setSmartDetectDescription] = useState(
    starterSmartDetectDescription
  )
  const [smartContextDescription, setSmartContextDescription] = useState(
    starterSmartContextDescription
  )
  const [scRows, setScRows] = useState<SmartContextRow[]>([])
  const [smartContextSections, setSmartContextSections] =
    useState<SmartContextSection[]>([])
  const [finderRows, setFinderRows] = useState<FinderRow[]>([])
  const [scError, setScError] = useState('')
  const [finderError, setFinderError] = useState('')

  // Technical Configuration JSON editor UI
  const [smartContextConfigs, setSmartContextConfigs] =
    useState<JsonConfigEntry[]>([])

  const [smartDetectConfigs, setSmartDetectConfigs] =
    useState<JsonConfigEntry[]>([])
  // Details
  const [uniqueUserDetails, setUniqueUserDetails] = useState(
    starterUniqueUserDescription
  )
  const [roleSegmentationDetails, setRoleSegmentationDetails] = useState(
    starterRoleSegmentationDescription
  )
  const [notice, setNotice] = useState('')

  // Track which Details tabs the user has visited
  useEffect(() => {
    if (active !== 'details') return

    setVisitedDetailTabs((previous) =>
      previous.includes(detailTab)
        ? previous
        : [...previous, detailTab]
    )
  }, [active, detailTab])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const exportDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  // ---------------------------------------------------------------------------
  // Authentication handlers
  // ---------------------------------------------------------------------------

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), token }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to login.')
      }

      if (
        !data.user ||
        typeof data.user.name !== 'string' ||
        typeof data.user.email !== 'string' ||
        typeof data.user.initials !== 'string'
      ) {
        throw new Error('Invalid user information received from server.')
      }

      setUser(data.user)
      setEmail('')
      setToken('')
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      )
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    setUser(null)
    setShowProfile(false)
    setEmail('')
    setToken('')
    setLoginError('')
  }

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  const update = (key: keyof ApplicationForm, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }))
  }
  const addJsonConfig = (
    type: 'smartContext' | 'smartDetect'
  ) => {
    const newEntry: JsonConfigEntry = {
      id: crypto.randomUUID(),
      name:
        type === 'smartContext'
          ? `Smart Context JSON ${smartContextConfigs.length + 1}`
          : `Smart Detect JSON ${smartDetectConfigs.length + 1}`,
      value: '',
      expanded: true,
      valid: null,
      error: '',
    }

    if (type === 'smartContext') {
      setSmartContextConfigs((previous) => [
        ...previous.map((item) => ({ ...item, expanded: false })),
        newEntry,
      ])
    } else {
      setSmartDetectConfigs((previous) => [
        ...previous.map((item) => ({ ...item, expanded: false })),
        newEntry,
      ])
    }
  }

  const updateJsonConfig = (
    type: 'smartContext' | 'smartDetect',
    id: string,
    changes: Partial<JsonConfigEntry>
  ) => {
    const setter =
      type === 'smartContext'
        ? setSmartContextConfigs
        : setSmartDetectConfigs

    setter((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, ...changes } : item
      )
    )
  }
  const removeJsonConfig = (
    type: 'smartContext' | 'smartDetect',
    id: string
  ) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this JSON configuration? This action cannot be undone.'
    )

    if (!confirmed) return

    if (type === 'smartContext') {
      setSmartContextConfigs((previous) =>
        previous.filter((item) => item.id !== id)
      )
    } else {
      setSmartDetectConfigs((previous) =>
        previous.filter((item) => item.id !== id)
      )
    }
  }

  const validateJsonConfig = (
    type: 'smartContext' | 'smartDetect',
    id: string
  ) => {
    const configs =
      type === 'smartContext'
        ? smartContextConfigs
        : smartDetectConfigs

    const entry = configs.find((item) => item.id === id)

    if (!entry) return

    try {
      if (!entry.value.trim()) {
        throw new Error('Please enter JSON before validating.')
      }

      if (type === 'smartContext') {
        const table = parseSmartContextTable(entry.value)

        updateJsonConfig(type, id, {
          valid: true,
          error: '',
          table,
        })
      } else {
        const parsedRows = parseFinder(entry.value)

        setFinderRows(parsedRows)

        updateJsonConfig(type, id, {
          valid: true,
          error: '',
          table: undefined,
        })
      }
    } catch (error) {
      updateJsonConfig(type, id, {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid JSON',
        table: undefined,
      })
    }
  }

  const addSmartContextSection = () => {
    setSmartContextSections((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        type: '',
        customName: '',
        content: '',
        expanded: true,
      },
    ])
  }

  const updateSmartContextSection = (
    id: string,
    changes: Partial<SmartContextSection>
  ) => {
    setSmartContextSections((previous) =>
      previous.map((section) =>
        section.id === id ? { ...section, ...changes } : section
      )
    )
  }

  const removeSmartContextSection = (id: string) => {
    setSmartContextSections((previous) =>
      previous.filter((section) => section.id !== id)
    )
  }

  const selectSmartContextSectionType = (
    id: string,
    type: SmartContextSectionType | ''
  ) => {
    updateSmartContextSection(id, {
      type,
      customName: '',
      content:
        type && type !== 'Custom'
          ? smartContextDescriptions[type]
          : '',
    })
  }

  // Incomplete items for each sidebar section
  const sectionIncompleteCounts = useMemo(() => {
    const isEmpty = (value: string) => !value.trim()

    return {
      overview: [
        form.customerName,
        form.applicationName,
        form.entName,
        form.version,
        form.analysisStartDate,
        form.analysisEndDate,
      ].filter(isEmpty).length,

      observations: !DOMPurify.sanitize(form.observations, {
        ALLOWED_TAGS: [],
      })
        .replace(/&nbsp;/g, ' ')
        .trim()
        ? 1
        : 0,

      recommendations: !DOMPurify.sanitize(form.recommendations, {
        ALLOWED_TAGS: [],
      })
        .replace(/&nbsp;/g, ' ')
        .trim()
        ? 1
        : 0,

      applicationDetails: [
        form.iframes === 'Unknown' ? '' : form.iframes,
        form.languages,
        form.development,
        form.personas,
        form.browsers,
      ].filter(isEmpty).length,

      checklist: [
        form.smartContextStatus,
        form.elementDetectionStatus,
        form.uniqueUserStatus,
        form.roleSegmentationStatus,
      ].filter((status) => status !== 'Yes' && status !== 'No').length,

      details: 4 - visitedDetailTabs.length,

      technicalConfiguration: [
        smartContextConfigs.some((item) => item.valid === true),
        smartDetectConfigs.some((item) => item.valid === true),
      ].filter((isComplete) => !isComplete).length,
    }
  }, [
    form,
    smartContextConfigs,
    smartDetectConfigs,
    uniqueUserDetails,
    roleSegmentationDetails,
    visitedDetailTabs,
  ])

  const totalFields = 23

  const incompleteFields = Object.values(sectionIncompleteCounts).reduce(
    (total, count) => total + count,
    0
  )

  const completedCount = totalFields - incompleteFields

  const progress = Math.round((completedCount / totalFields) * 100)
  // ---------------------------------------------------------------------------
  // Configuration parsers
  // ---------------------------------------------------------------------------
  const flattenSmartContextRules = (value: unknown): Record<string, any>[] => {
    if (!Array.isArray(value)) return []

    return value.flatMap((item) => {
      if (Array.isArray(item)) {
        return flattenSmartContextRules(item)
      }

      if (item && typeof item === 'object') {
        return [item as Record<string, any>]
      }

      return []
    })
  }

  // Splits selectors on commas only when they are outside brackets,
  // parentheses, and quoted strings.
  const splitCssSelectors = (value: string): string[] => {
    const selectors: string[] = []
    let current = ''
    let squareDepth = 0
    let roundDepth = 0
    let quote = ''
    let escaped = false

    for (const char of value) {
      if (escaped) {
        current += char
        escaped = false
        continue
      }

      if (char === '\\') {
        current += char
        escaped = true
        continue
      }

      if (quote) {
        current += char
        if (char === quote) quote = ''
        continue
      }

      if (char === '"' || char === "'") {
        quote = char
        current += char
        continue
      }

      if (char === '[') squareDepth++
      if (char === ']') squareDepth = Math.max(0, squareDepth - 1)
      if (char === '(') roundDepth++
      if (char === ')') roundDepth = Math.max(0, roundDepth - 1)

      if (char === ',' && squareDepth === 0 && roundDepth === 0) {
        if (current.trim()) selectors.push(current.trim())
        current = ''
        continue
      }

      current += char
    }

    if (current.trim()) selectors.push(current.trim())

    return selectors
  }
  const formatSmartContextAttribute = (value: unknown): string => {
    const attributeLabels: Record<string, string> = {
      DYNAMIC_PART: 'Dynamic Part',
      FIRST_ALPHABETIC_WITH_SPECIAL_CHARS:
        'First alphabetic with special chars',
      GOOD: 'Good',
      WITHOUT_ALPHANUMERIC: 'Good when not alphanumeric',
      WITHOUT_NUMERIC: 'Good when not numeric',
      TRUST_ONLY_FIRST_ALPHABETIC: 'Trust only first alphabetic',
    }

    const rawValue = String(value ?? '').trim()

    return attributeLabels[rawValue] || rawValue
  }
  const parseSmartContextTable = (json: string): SmartContextTable => {
    const data = JSON.parse(json)

    const groups = Array.isArray(data.rule_config_is)
      ? data.rule_config_is
      : []

    const warnings: string[] = []

    const sections: SmartContextTableSection[] = groups.map(
      (group: unknown, index: number) => {
        const rules = flattenSmartContextRules(group)

        // The first rule_config_is entry is always Global.
        const sectionName =
          index === 0
            ? 'Global'
            : rules.find(
              (rule) =>
                rule.type === 'fixed_page' &&
                typeof rule.op1 === 'string' &&
                rule.op1.trim()
            )?.op1?.trim() || `Section ${index + 1}`

        if (
          index > 0 &&
          !rules.some(
            (rule) =>
              rule.type === 'fixed_page' &&
              typeof rule.op1 === 'string' &&
              rule.op1.trim()
          )
        ) {
          warnings.push(
            `Section ${index + 1}: fixed_page condition is missing.`
          )
        }

        // Scope priority: element_hierarchy -> element_exists -> Fallback.
        const hierarchyRules = rules.filter(
          (rule) =>
            rule.type === 'element_hierarchy' &&
            typeof rule.op1 === 'string' &&
            rule.op1.trim()
        )

        const existsRules = rules.filter(
          (rule) =>
            rule.type === 'element_exists' &&
            typeof rule.op1 === 'string' &&
            rule.op1.trim()
        )

        const scopeRules =
          hierarchyRules.length > 0
            ? hierarchyRules
            : existsRules

        const scope = [
          ...new Set(
            scopeRules.flatMap((rule) =>
              splitCssSelectors(rule.op1)
            )
          ),
        ]

        if (scope.length === 0) {
          scope.push('Fallback')
        }

        // Keep each identification condition as a separate row.
        const identifications: SmartContextIdentification[] = []

        rules.forEach((rule) => {
          if (
            rule.type === 'element_hierarchy' ||
            rule.type === 'element_exists'
          ) {
            return
          }

          if (!rule.type || typeof rule.type !== 'string') return

          let identification = rule.type
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char: string) => char.toUpperCase())

          // Add the operator to Path identification when it is not a trust condition.
          if (rule.type === 'path' && rule.operator && rule.operator !== 'trust') {
            const operatorLabels: Record<string, string> = {
              '~': 'Contains',
              '~!': 'Not Contains',
              '^': 'Starts With',
              '$': 'Ends With',
              '=': 'Equals',
              '!=': 'Not Equals',
              trust: 'Trust',
            }

            const operatorLabel =
              operatorLabels[String(rule.operator)] ||
              String(rule.operator)
                .replace(/_/g, ' ')
                .toLowerCase()
                .replace(/\b\w/g, (char: string) => char.toUpperCase())

            identification = `${identification} (${operatorLabel})`
          }

          // Trust conditions use trustable; other Path conditions use op1.
          const rawAttributes =
            rule.type === 'path'
              ? rule.operator === 'trust'
                ? [rule.trustable]
                : [rule.op1]
              : rule.type === 'element_property'
                ? [rule.op2]
                : [rule.op1, rule.trustable]

          const attributes = rawAttributes
            .filter(
              (value) =>
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ''
            )
            .map((value) => formatSmartContextAttribute(String(value).trim()))

          if (attributes.length === 0) return

          identifications.push({
            identification,
            attribute: [...new Set(attributes)].join(', '),
          })
        })
        return {
          section: sectionName,
          scope,
          identifications,
        }
      }
    )

    return {
      sections,
      warnings,
    }
  }
  // ---------------------------------------------------------------------------
  // Draft management
  // ---------------------------------------------------------------------------

  const makeDraft = () => ({
    form,
    smartContextJson: scJson,
    smartContextSections,
    smartContextConfigs,
    smartDetectConfigs,
    finderJson,
    smartDetectDescription,
    smartContextDescription,
    uniqueUserDetails,
    roleSegmentationDetails,
  })

  const downloadJson = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const saveDraft = () => {
    downloadJson(makeDraft(), 'application-analysis-draft.json')
    setNotice('Draft JSON downloaded.')
  }

  const uploadDraft = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const draft = JSON.parse(await file.text())

      if (
        !draft ||
        typeof draft !== 'object' ||
        !draft.form ||
        typeof draft.form !== 'object' ||
        Array.isArray(draft.form)
      ) {
        throw new Error('Invalid draft file')
      }

      const restoredForm = { ...initialForm }

        ; (Object.keys(initialForm) as (keyof ApplicationForm)[]).forEach((key) => {
          if (typeof draft.form[key] === 'string') {
            restoredForm[key] = draft.form[key]
          }
        })

      const restoredSC =
        typeof draft.smartContextJson === 'string' ? draft.smartContextJson : starterSC

      const restoredFinder =
        typeof draft.finderJson === 'string' ? draft.finderJson : starterFinder

      setForm(restoredForm)
      setScJson(restoredSC)
      setSmartContextSections(
        Array.isArray(draft.smartContextSections)
          ? draft.smartContextSections.filter(
            (section: unknown): section is SmartContextSection =>
              !!section &&
              typeof section === 'object' &&
              typeof (section as SmartContextSection).id === 'string' &&
              typeof (section as SmartContextSection).type === 'string' &&
              typeof (section as SmartContextSection).customName === 'string' &&
              typeof (section as SmartContextSection).content === 'string'
          )
          : []
      )
      setFinderJson(restoredFinder)
      setSmartContextConfigs(
        Array.isArray(draft.smartContextConfigs)
          ? draft.smartContextConfigs
          : []
      )

      setSmartDetectConfigs(
        Array.isArray(draft.smartDetectConfigs)
          ? draft.smartDetectConfigs
          : []
      )
      setSmartDetectDescription(
        typeof draft.smartDetectDescription === 'string'
          ? draft.smartDetectDescription
          : starterSmartDetectDescription
      )
      setSmartContextDescription(
        typeof draft.smartContextDescription === 'string'
          ? draft.smartContextDescription
          : starterSmartContextDescription
      )
      setUniqueUserDetails(
        typeof draft.uniqueUserDetails === 'string'
          ? draft.uniqueUserDetails
          : starterUniqueUserDescription
      )
      setRoleSegmentationDetails(
        typeof draft.roleSegmentationDetails === 'string'
          ? draft.roleSegmentationDetails
          : starterRoleSegmentationDescription
      )

      try {
        setScRows(parseSmartContext(restoredSC))
        setScError('')
      } catch {
        setScRows([])
      }

      try {
        setFinderRows(parseFinder(restoredFinder))
        setFinderError('')
      } catch {
        setFinderRows([])
      }

      setActive('overview')
      setDetailTab('smartContext')
      setNotice('Draft uploaded successfully.')
    } catch (error) {
      console.error('Draft upload failed:', error)
      setNotice('Unable to load draft. Please select a valid JSON draft file.')
    } finally {
      event.target.value = ''
    }
  }

  const resetDraft = () => {
    if (
      !window.confirm(
        'Are you sure you want to reset this document? All current changes will be cleared.'
      )
    ) return

    setForm({ ...initialForm })
    setScJson(starterSC)
    setSmartContextSections([])
    setSmartContextConfigs([])
    setSmartDetectConfigs([])
    setVisitedDetailTabs([])
    setFinderJson(starterFinder)
    setSmartDetectDescription(starterSmartDetectDescription)
    setSmartContextDescription(starterSmartContextDescription)
    setScRows([])
    setFinderRows([])
    setScError('')
    setFinderError('')
    setUniqueUserDetails(starterUniqueUserDescription)
    setRoleSegmentationDetails(starterRoleSegmentationDescription)
    setDetailTab('smartContext')
    setActive('overview')
    setNotice('Document reset successfully.')
  }

  // ---------------------------------------------------------------------------
  // Document PDF
  // ---------------------------------------------------------------------------

  const exportPdf = () => {
    // Print the actual live-preview element, not a separately generated document.
    window.print()
  }

  // ---------------------------------------------------------------------------
  // Login screen
  // ---------------------------------------------------------------------------

  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-brand-mark"><Sparkles size={22} /></div>
            <div>
              <strong>Outcome Builder</strong>
              <small>APPLICATION ANALYSIS</small>
            </div>
          </div>

          <div className="login-heading">
            <h1>Welcome back</h1>
            <p>Sign in with your Whatfix credentials to continue.</p>
          </div>

          <form onSubmit={handleLogin}>
            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter Email Address"
                required
              />
            </label>

            <label className="field">
              <span>Access token</span>
              <input
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Enter your access token"
                required
              />
            </label>

            {loginError && (
              <div className="login-error">
                <AlertCircle size={15} />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary login-submit"
              disabled={loginLoading}
            >
              {loginLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="login-footer">
            <ShieldCheck size={15} />
            <span>Access restricted to Whatfix team members.</span>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Profile page
  // ---------------------------------------------------------------------------

  if (showProfile) {
    return (
      <div className="profile-page-shell">
        <div className="profile-page">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowProfile(false)}
          >
            ← Back to Workspace
          </button>

          <div className="profile-page-heading">
            <div className="profile-large-avatar">{user.initials}</div>
            <h1>My Profile</h1>
            <p>Account information</p>
          </div>

          <div className="profile-details">
            <div>
              <span>Full name</span>
              <b>{user.name}</b>
            </div>
            <div>
              <span>Email address</span>
              <b>{user.email}</b>
            </div>
            <div>
              <span>Organization</span>
              <b>Whatfix</b>
            </div>
          </div>

          <button className="profile-signout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Main workspace
  // ---------------------------------------------------------------------------

  return (
    <div className="app-shell">

      <aside className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Brand and collapse button */}
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={19} />
          </div>

          {!sidebarCollapsed && (
            <div className="brand-copy">
              <strong>Outcome Builder</strong>
              <small>APPLICATION ANALYSIS</small>
            </div>
          )}

          <button
            className="icon-button collapse"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            type="button"
            onClick={() => setSidebarCollapsed((previous) => !previous)}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={17} />
            ) : (
              <PanelLeftClose size={17} />
            )}
          </button>
        </div>

        {/* Navigation label */}
        {!sidebarCollapsed && (
          <div className="nav-label">DOCUMENT SECTIONS</div>
        )}
        {/* Document completion */}
        {!sidebarCollapsed && (
          <div className="sidebar-progress">
            <div className="sidebar-progress-heading">
              <Activity size={18} />
              <b>Document completion</b>
            </div>

            <div className="sidebar-progress-value">
              <strong>{progress}%</strong>
              <span>{completedCount} of {totalFields} fields completed</span>
            </div>

            <div className="progress-track">
              <div style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Navigation items */}
        {/* Navigation items */}
        <nav>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`nav-item ${active === id ? 'active' : ''}`}
              onClick={() => setActive(id)}
              title={
                sidebarCollapsed
                  ? `${label} - ${sectionIncompleteCounts[id]} incomplete`
                  : undefined
              }
            >
              <Icon size={17} />

              {!sidebarCollapsed && (
                <span className="nav-item-label">{label}</span>
              )}

              <span
                className={`nav-count ${sectionIncompleteCounts[id] === 0 ? 'complete' : ''
                  }`}
              >
                {sectionIncompleteCounts[id]}
              </span>
            </button>
          ))}
        </nav>

        {/* Profile */}
        <div className="sidebar-bottom">
          <button
            type="button"
            className="profile"
            onClick={() => setShowProfile(true)}
            title={sidebarCollapsed ? user.name : undefined}
          >
            <div className="profile-avatar">{user.initials}</div>

            {!sidebarCollapsed && (
              <div className="profile-info">
                <b>{user.name}</b>
                <small>{user.email}</small>
              </div>
            )}
          </button>
        </div>
      </aside>


      <main className="main-area">
        <header className="topbar">
          <div className="page-heading">
            <div>
              <h1>Application Analysis <span>Outcome Builder</span></h1>
              <p>
                Capture findings, configure identification rules, and prepare a consistent outcome document.
              </p>
            </div>
          </div>

          <div className="top-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={uploadDraft}
            />

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp size={16} />
              Upload draft
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={saveDraft}
            >
              <Save size={16} />
              Save draft
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetDraft}
            >
              <RotateCcw size={16} />
              Reset
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={exportPdf}
            >
              <FileText size={16} />
              Export PDF
            </button>
          </div>
        </header>

        <div className="content-wrap">




          {notice && (
            <div className="notice">
              <CheckCircle2 size={16} />
              {notice}
              <button onClick={() => setNotice('')} aria-label="Dismiss notice">×</button>
            </div>
          )}

          <div className="work-grid">
            <section className="editor-column">

              {/* 1. Overview */}
              {active === 'overview' && (
                <section className="panel">
                  <PanelHeading
                    title="1. Overview"
                    description="Basic information that identifies this analysis."
                    step="01 / 07"
                    icon={LayoutDashboard}
                  />

                  <div className="field-grid">
                    <Field label="Customer / organization" value={form.customerName} onChange={(v) => update('customerName', v)} placeholder="e.g. Whatfix" />
                    <Field label="Application name" value={form.applicationName} onChange={(v) => update('applicationName', v)} placeholder="e.g. Dashboard-Guidance" />
                    <Field label="Enterprise name (ENT)" value={form.entName} onChange={(v) => update('entName', v)} placeholder="e.g. whatfix_sandbox" />
                    <Field label="Application version" value={form.version} onChange={(v) => update('version', v)} placeholder="e.g. 2.4.1" />
                    <Field label="Analysis start date" type="date" value={form.analysisStartDate} onChange={(v) => update('analysisStartDate', v)} />
                    <Field label="Analysis end date" type="date" value={form.analysisEndDate} onChange={(v) => update('analysisEndDate', v)} />
                  </div>

                  <PanelFooter onContinue={() => setActive('observations')} />
                </section>
              )}

              {/* 2. Observations */}
              {active === 'observations' && (
                <section className="panel">
                  <PanelHeading
                    title="2. Observations"
                    description="Record findings from the application analysis."
                    step="02 / 07"
                    icon={ListChecks}
                    color="amber"
                  />

                  <div className="field">
                    <RichTextEditor
                      value={form.observations}
                      onChange={(value) => update('observations', value)}
                    />
                  </div>

                  <PanelFooter
                    onBack={() => setActive('overview')}
                    onContinue={() => setActive('recommendations')}
                  />
                </section>
              )}

              {/* 3. Recommendations */}
              {active === 'recommendations' && (
                <section className="panel">
                  <PanelHeading
                    title="3. Recommendations"
                    description="Capture the recommended configuration or follow-up actions."
                    step="03 / 07"
                    icon={Lightbulb}
                    color="amber"
                  />

                  <div className="field">
                    <RichTextEditor
                      value={form.recommendations}
                      onChange={(value) => update('recommendations', value)}
                    />
                  </div>

                  <PanelFooter
                    onBack={() => setActive('observations')}
                    onContinue={() => setActive('applicationDetails')}
                  />
                </section>
              )}

              {/* 4. Application Details */}
              {active === 'applicationDetails' && (
                <section className="panel">
                  <PanelHeading
                    title="4. Application Details"
                    description="Record the technical and user context of the application."
                    step="04 / 07"
                    icon={AppWindow}
                    color="blue"
                  />

                  <div className="field-grid">
                    <SelectField label="Is the application supported Out Of The Box?" value={form.ootb} onChange={(v) => update('ootb', v)} options={['Yes', 'No']} />
                    <SelectField label="Are there iFrames in the application?" value={form.iframes} onChange={(v) => update('iframes', v)} options={['Yes', 'No']} />
                    <SelectField label="Does the application support multiple languages?" value={form.languages} onChange={(v) => update('languages', v)} options={['Yes', 'No']} />
                    <SelectField label="Is the application under regular development?" value={form.development} onChange={(v) => update('development', v)} options={['Yes', 'No']} />
                    <SelectField label="Does the application have multiple user personas?" value={form.personas} onChange={(v) => update('personas', v)} options={['Yes', 'No']} />
                    <Field label="What are the Browsers in Scope?" value={form.browsers} onChange={(v) => update('browsers', v)} placeholder="e.g. Chrome, Edge" />
                  </div>

                  <PanelFooter
                    onBack={() => setActive('recommendations')}
                    onContinue={() => setActive('checklist')}
                  />
                </section>
              )}

              {/* 5. Application Analysis Checklist */}
              {active === 'checklist' && (
                <section className="panel">
                  <PanelHeading
                    title="5. Application Analysis Checklist"
                    description="Mark whether each analysis area is covered."
                    step="05 / 07"
                    icon={ClipboardCheck}
                    color="green"
                  />

                  <div className="checklist">
                    {([
                      ['smartContextStatus', 'Smart Context', 'Page and section identification rules'],
                      ['elementDetectionStatus', 'Smart Detect', 'Element targeting and conditions'],
                      ['uniqueUserStatus', 'Unique User Identification', 'Stable user identifier is available'],
                      ['roleSegmentationStatus', 'Role-Based Content Segmentation', 'Role or persona attribute is available'],
                    ] as const).map(([key, title, description]) => (
                      <div className="check-row" key={key}>
                        <div className="check-bullet"><Check size={15} /></div>
                        <div className="check-desc">
                          <b>{title}</b>
                          <small>{description}</small>
                        </div>
                        <div
                          className={`check-select ${form[key] === 'Yes'
                            ? 'status-yes'
                            : form[key] === 'No'
                              ? 'status-no'
                              : 'status-default'
                            }`}
                        >
                          <select
                            value={form[key]}
                            onChange={(e) => update(key, e.target.value)}
                          >
                            {['Not started', 'Yes', 'No'].map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <PanelFooter
                    onBack={() => setActive('applicationDetails')}
                    onContinue={() => {
                      setActive('details')
                      setDetailTab('smartContext')
                    }}
                    continueLabel="Continue to Details →"
                  />
                </section>
              )}

              {/* 6. Details */}
              {active === 'details' && (
                <section className="panel">
                  <PanelHeading
                    title="6. Details"
                    description="Review the four implementation and identification areas."
                    step="06 / 07"
                    icon={Braces}
                  />

                  <div className="detail-tabs">
                    {detailTabs.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        className={`detail-tab-item ${detailTab === id ? 'active' : ''}`}
                        onClick={() => setDetailTab(id)}
                        title={label}
                      >
                        <Icon size={18} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>

                  {detailTab === 'smartContext' && (

                    <div className="detail-content">
                      <h3>6.1 Smart Context</h3>
                      <p>
                        Review and edit the Smart Context overview and its supporting documentation.
                      </p>
                      <div className="field">
                        <RichTextEditor
                          value={smartContextDescription}
                          onChange={setSmartContextDescription}
                          placeholder="Add Smart Context description"
                        />
                      </div>

                      <div className="smart-context-sections">
                        {smartContextSections.map((section, index) => (
                          <div className="smart-context-card" key={section.id}>
                            <div className="smart-context-card-header">
                              <strong>Section {index + 1}</strong>

                              <div className="smart-context-card-actions">
                                <button
                                  type="button"
                                  className="smart-context-toggle"
                                  onClick={() =>
                                    updateSmartContextSection(section.id, {
                                      expanded: section.expanded === false,
                                    })
                                  }
                                  title={section.expanded === false ? 'Expand section' : 'Collapse section'}
                                >
                                  {section.expanded === false ? 'Expand' : 'Collapse'}
                                </button>

                                <button
                                  type="button"
                                  className="smart-context-remove"
                                  onClick={() => removeSmartContextSection(section.id)}
                                  title="Remove section"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            {section.expanded !== false && (
                              <>
                                <label className="field">
                                  <span>Section type</span>

                                  <div className="select-wrap">
                                    <select
                                      value={section.type}
                                      onChange={(event) =>
                                        selectSmartContextSectionType(
                                          section.id,
                                          event.target.value as SmartContextSectionType | ''
                                        )
                                      }
                                    >
                                      <option value="">Select section</option>

                                      {smartContextSectionTypes.map((type) => (
                                        <option key={type} value={type}>
                                          {type}
                                        </option>
                                      ))}
                                    </select>

                                    <ChevronDown size={15} />
                                  </div>
                                </label>

                                {section.type === 'Custom' && (
                                  <label className="field">
                                    <span>Custom section name</span>

                                    <input
                                      type="text"
                                      value={section.customName}
                                      onChange={(event) =>
                                        updateSmartContextSection(section.id, {
                                          customName: event.target.value,
                                        })
                                      }
                                      placeholder="Enter custom section name"
                                    />
                                  </label>
                                )}

                                {section.type && (
                                  <div className="field">
                                    <span>Description</span>

                                    <RichTextEditor
                                      value={section.content}
                                      onChange={(content) =>
                                        updateSmartContextSection(section.id, { content })
                                      }
                                      placeholder={
                                        section.type === 'Custom'
                                          ? 'Please add the description'
                                          : 'Add your description'
                                      }
                                    />
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary smart-context-add"
                        onClick={addSmartContextSection}
                      >
                        <Plus size={16} />
                        Add Section
                      </button>
                    </div>

                  )}

                  {detailTab === 'smartDetect' && (
                    <div className="detail-content">
                      <h3>6.2 Smart Detect</h3>
                      <p>
                        Review and edit the Smart Detect overview and its supporting documentation.
                      </p>

                      <div className="field">
                        <span>Description</span>

                        <RichTextEditor
                          value={smartDetectDescription}
                          onChange={setSmartDetectDescription}
                          placeholder="Add Smart Detect description"
                        />
                      </div>

                    </div>
                  )}

                  {detailTab === 'uniqueUser' && (
                    <div className="detail-content">
                      <div className="field">
                        <RichTextEditor
                          value={uniqueUserDetails}
                          onChange={setUniqueUserDetails}
                          placeholder="Add Unique User Identification details"
                        />
                      </div>
                    </div>
                  )}

                  {detailTab === 'roleSegmentation' && (
                    <div className="detail-content">
                      <div className="field">
                        <RichTextEditor
                          value={roleSegmentationDetails}
                          onChange={setRoleSegmentationDetails}
                          placeholder="Add Role-Based Content Segmentation details"
                        />
                      </div>
                    </div>
                  )}

                  <PanelFooter
                    onBack={() => setActive('checklist')}
                    onContinue={() => setActive('technicalConfiguration')}
                    continueLabel="Continue to Technical Configuration →"
                  />
                </section>
              )}

              {/* 7. Technical Configuration */}
              {active === 'technicalConfiguration' && (
                <section className="panel">
                  <div className="technical-config-tabs">
                    <button
                      type="button"
                      className={configTab === 'smartContext' ? 'active' : ''}
                      onClick={() => setConfigTab('smartContext')}
                    >
                      <Braces size={21} />
                      <span>Smart Context</span>
                    </button>

                    <button
                      type="button"
                      className={configTab === 'smartDetect' ? 'active' : ''}
                      onClick={() => setConfigTab('smartDetect')}
                    >
                      <Search size={21} />
                      <span>Smart Detect</span>
                    </button>
                  </div>
                  {configTab === 'smartContext' && (
                    <>
                      {/* Smart Context JSON */}
                      <div className="technical-config-card">
                        <div className="technical-config-heading">
                          <div>
                            <h3>Smart Context configuration</h3>
                            <p>Add one or more Smart Context source JSON configurations.</p>
                          </div>

                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => addJsonConfig('smartContext')}
                          >
                            <Plus size={15} />
                            Add Smart Context JSON
                          </button>
                        </div>

                        {smartContextConfigs.map((item, index) => (
                          <div className="json-config-item" key={item.id}>
                            {!item.expanded ? (
                              <div className="json-config-collapsed">
                                <div className="json-config-info">
                                  <b>{item.name || `Smart Context JSON ${index + 1}`}</b>

                                  {item.valid === true && (
                                    <span className="json-status-valid">
                                      Validated
                                    </span>
                                  )}

                                  {item.valid === false && (
                                    <span className="json-status-invalid">
                                      Invalid JSON
                                    </span>
                                  )}
                                </div>

                                <div className="json-config-actions">
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => removeJsonConfig('smartContext', item.id)}
                                  >
                                    Delete
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() =>
                                      updateJsonConfig('smartContext', item.id, {
                                        expanded: true,
                                      })
                                    }
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="json-config-title">
                                  <input
                                    type="text"
                                    className="json-config-name-input"
                                    value={item.name || ''}
                                    placeholder={`Smart Context JSON ${index + 1}`}
                                    aria-label="Smart Context configuration name"
                                    onChange={(event) =>
                                      updateJsonConfig('smartContext', item.id, {
                                        name: event.target.value,
                                      })
                                    }
                                  />

                                  <div className="json-config-actions">
                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      onClick={() => removeJsonConfig('smartContext', item.id)}
                                    >
                                      Delete
                                    </button>

                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      onClick={() =>
                                        updateJsonConfig('smartContext', item.id, {
                                          expanded: false,
                                        })
                                      }
                                    >
                                      Hide editor
                                    </button>
                                  </div>
                                </div>

                                <textarea
                                  className="technical-json-input"
                                  value={item.value}
                                  spellCheck={false}
                                  placeholder="Paste Smart Context JSON here..."
                                  onChange={(event) =>
                                    updateJsonConfig('smartContext', item.id, {
                                      value: event.target.value,
                                      valid: null,
                                      error: '',
                                    })
                                  }
                                />

                                {item.error && (
                                  <p className="json-validation-error">
                                    {item.error}
                                  </p>
                                )}

                                {item.valid === true && (
                                  <p className="json-validation-success">
                                    JSON syntax is valid.
                                  </p>
                                )}

                                <div className="json-editor-actions">
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() =>
                                      validateJsonConfig('smartContext', item.id)
                                    }
                                  >
                                    Validate JSON
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}


                      </div>
                    </>
                  )}
                  {configTab === 'smartDetect' && (
                    <>
                      {/* Smart Detect JSON */}
                      <div className="technical-config-card">
                        <div className="technical-config-heading">
                          <div>
                            <h3>Smart Detect configuration</h3>
                            <p>Add one or more Smart Detect source JSON configurations.</p>
                          </div>

                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => addJsonConfig('smartDetect')}
                          >
                            <Plus size={15} />
                            Add Smart Detect JSON
                          </button>
                        </div>

                        {smartDetectConfigs.map((item, index) => (
                          <div className="json-config-item" key={item.id}>
                            {!item.expanded ? (
                              <div className="json-config-collapsed">
                                <div className="json-config-info">
                                  <b>Smart Detect JSON {index + 1}</b>

                                  {item.valid === true && (
                                    <span className="json-status-valid">
                                      Validated
                                    </span>
                                  )}

                                  {item.valid === false && (
                                    <span className="json-status-invalid">
                                      Invalid JSON
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={() =>
                                    updateJsonConfig('smartDetect', item.id, {
                                      expanded: true,
                                    })
                                  }
                                >
                                  Edit
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="json-config-title">
                                  <b>Smart Detect JSON {index + 1}</b>

                                  <div className="json-config-actions">
                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      onClick={() =>
                                        removeJsonConfig('smartDetect', item.id)
                                      }
                                    >
                                      Delete
                                    </button>

                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      onClick={() =>
                                        updateJsonConfig('smartDetect', item.id, {
                                          expanded: false,
                                        })
                                      }
                                    >
                                      Hide editor
                                    </button>
                                  </div>
                                </div>

                                <textarea
                                  className="technical-json-input"
                                  value={item.value}
                                  spellCheck={false}
                                  placeholder="Paste Smart Detect JSON here..."
                                  onChange={(event) =>
                                    updateJsonConfig('smartDetect', item.id, {
                                      value: event.target.value,
                                      valid: null,
                                      error: '',
                                    })
                                  }
                                />

                                {item.error && (
                                  <p className="json-validation-error">
                                    {item.error}
                                  </p>
                                )}

                                {item.valid === true && (
                                  <p className="json-validation-success">
                                    JSON syntax is valid.
                                  </p>
                                )}

                                <div className="json-editor-actions">
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() =>
                                      validateJsonConfig('smartDetect', item.id)
                                    }
                                  >
                                    Validate JSON
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <PanelFooter
                    onBack={() => setActive('details')}
                    onContinue={() => setActive('overview')}
                    continueLabel="Back to overview"
                  />

                </section>
              )}
            </section>

            {/* Live Preview */}
            <aside className="preview-column">


              <div className="document">
                <div className="doc-topline">
                  <div className="doc-brand">
                    <div className="doc-logo">W</div>
                    <span>WHATFIX</span>
                  </div>
                  <span className="doc-tag">{exportDate}</span>
                </div>

                <div className="doc-rule" />

                <h2>Application Analysis<br /><span>Outcome Document</span></h2>
                <p className="doc-subtitle">Technical analysis &amp; implementation recommendations</p>

                <DocSection title="1. Overview">
                  <p className="doc-preserve">
                    The objective of this document is to provide the outcome of the application
                    analysis performed by the Whatfix team for an application and enlist
                    observations, best practices for content creation, and recommendations.
                  </p>
                </DocSection>
                <h5>Application Details</h5>
                <div className="doc-meta">
                  <div>
                    <small>CUSTOMER</small>
                    <b>{form.customerName || '—'}</b>
                  </div>

                  <div>
                    <small>APPLICATION</small>
                    <b>{form.applicationName || '—'}</b>
                  </div>

                  <div>
                    <small>ENT NAME</small>
                    <b>{form.entName || '—'}</b>
                  </div>

                  <div>
                    <small>VERSION</small>
                    <b>{form.version || '—'}</b>
                  </div>

                  <div>
                    <small>START DATE</small>
                    <b>{form.analysisStartDate || '—'}</b>
                  </div>

                  <div>
                    <small>END DATE</small>
                    <b>{form.analysisEndDate || '—'}</b>
                  </div>
                </div>

                <DocSection title="2. Observations">
                  {form.observations &&
                    DOMPurify.sanitize(form.observations).replace(/<[^>]*>/g, '').trim() ? (
                    <div
                      className="doc-preserve rich-text-preview"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(form.observations),
                      }}
                    />
                  ) : (
                    <p className="doc-preserve">
                      Observations will appear here after you enter them.
                    </p>
                  )}
                </DocSection>

                <DocSection title="3. Recommendations">
                  {form.recommendations &&
                    DOMPurify.sanitize(form.recommendations).replace(/<[^>]*>/g, '').trim() ? (
                    <div
                      className="doc-preserve rich-text-preview"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(form.recommendations),
                      }}
                    />
                  ) : (
                    <p className="doc-preserve">
                      Recommendations will appear here after you enter them.
                    </p>
                  )}
                </DocSection>

                <DocSection title="4. Application Details">
                  <div className="doc-detail-grid">
                    <span>Support Out Of The Box</span><b>{form.ootb}</b>
                    <span>Uses iframes</span><b>{form.iframes}</b>
                    <span>Support multiple language</span><b>{form.languages}</b>
                    <span>Under regular development</span><b>{form.development}</b>
                    <span>Multiple user personas</span><b>{form.personas}</b>
                    <span>Browsers in Scope</span><b>{form.browsers}</b>
                  </div>
                </DocSection>

                <DocSection title="5. Application Analysis Checklist">
                  <div className="doc-checklist">
                    <span>Smart Context</span><b>{form.smartContextStatus}</b>
                    <span>Smart Detect</span><b>{form.elementDetectionStatus}</b>
                    <span>Unique User Identification</span><b>{form.uniqueUserStatus}</b>
                    <span>Role-Based Content Segmentation</span><b>{form.roleSegmentationStatus}</b>
                  </div>
                </DocSection>

                <DocSection title="6. Details">
                  <h4>6.1 Smart Context</h4>

                  <div
                    className="doc-preserve rich-text-preview"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(smartContextDescription),
                    }}
                  />

                  {smartContextSections.map((section) => (
                    <div className="doc-smart-context-section" key={section.id}>
                      <h5>
                        {section.type === 'Custom'
                          ? section.customName || 'Custom'
                          : section.type}
                      </h5>

                      {section.content &&
                        DOMPurify.sanitize(section.content)
                          .replace(/<[^>]*>/g, '')
                          .trim() ? (
                        <div
                          className="doc-preserve rich-text-preview"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(section.content),
                          }}
                        />
                      ) : null}
                    </div>
                  ))}

                  <h4>6.2 Smart Detect</h4>
                  <div
                    className="doc-preserve rich-text-preview"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(smartDetectDescription),
                    }}
                  />

                  <h4>6.3 Unique User Identification</h4>

                  <div
                    className="doc-preserve rich-text-preview"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(uniqueUserDetails),
                    }}
                  />
                  <h4>6.4 Role-Based Content Segmentation</h4>

                  <div
                    className="doc-preserve rich-text-preview"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(roleSegmentationDetails),
                    }}
                  />
                </DocSection>

                <DocSection title="7. Technical Configuration Details">
                  <h4>7.1 Smart Context Configuration</h4>

                  {smartContextConfigs.some((item) => item.table) ? (
                    smartContextConfigs.map((item, index) =>
                      item.table ? (
                        <div key={item.id} className="doc-smart-context-config">
                          <DataTable
                            title={item.name?.trim() || `Smart Context JSON ${index + 1}`}
                            columns={['Section', 'Scope', 'Identification', 'Attribute']}
                            mergeFirstColumn
                            count={item.table.sections.length}
                            rows={item.table.sections.flatMap((section) => {
                              const scope = section.scope.map((selector) => `• ${selector}`).join('\n')

                              return section.identifications.length > 0
                                ? section.identifications.map((identification) => [
                                  section.section,
                                  scope,
                                  identification.identification,
                                  identification.attribute,
                                ])
                                : [[section.section, scope, '', '']]
                            })}
                          />

                          {item.table.warnings.length > 0 && (
                            <div className="json-validation-error">
                              {item.table.warnings.map((warning, warningIndex) => (
                                <p key={warningIndex}>{warning}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null
                    )
                  ) : (
                    <p className="muted-note">
                      Validate a Smart Context JSON configuration to display its parsed table here.
                    </p>
                  )}

                  <h4>7.2 Smart Detect Configuration</h4>

                  {finderRows.length > 0 ? (
                    <DataTable
                      title="Smart Detect Rules"
                      columns={['Scope', 'Attribute', 'Condition']}
                      rows={finderRows.map((row) => [
                        row.scope,
                        row.attribute,
                        row.condition,
                      ])}
                    />
                  ) : (
                    <p className="muted-note">
                      Smart Detect configuration table will appear here.
                    </p>
                  )}
                </DocSection>

                <div className="doc-footer">
                  <span>Application Analysis Outcome Document</span>
                </div>
              </div>


            </aside>
          </div>
        </div>
      </main >
    </div >
  )
}

export default App
